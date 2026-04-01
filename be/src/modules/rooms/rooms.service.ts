import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from '../../prisma.service';
import { calculateGuessResult } from '../games/utils/calculateGuessResult';
import { AblyService } from '../realtime/ably.service';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private readonly ablyService: AblyService,
  ) { }

  async getRoomState(roomCode: string) {
    const code = roomCode.trim();
    if (!code) {
      throw new BadRequestException('Mã phòng không được để trống');
    }

    let room = await this.prisma.room.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        codeLength: true,
        status: true,
        currentTurn: true,
        currentRound: true,
        turnStartedAt: true,
        endReason: true,
        winnerRole: true,
        players: {
          select: {
            id: true,
            nickname: true,
            role: true,
            missCount: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        guesses: {
          select: {
            id: true,
            playerInRoomId: true,
            guessValue: true,
            roundIndex: true,
            turnIndex: true,
            correctDigits: true,
            correctPositions: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }


    if (room.status === 'PLAYING' && room.currentTurn && room.turnStartedAt) {
      const now = new Date();
      const diffMs = now.getTime() - room.turnStartedAt.getTime();
      const timeoutMs = 2 * 60 * 1000;

      if (diffMs > timeoutMs) {
        await this.prisma.$transaction(async (tx) => {
          const liveRoom = await tx.room.findUnique({
            where: { id: room!.id },
            select: {
              id: true,
              code: true,
              status: true,
              currentTurn: true,
              turnStartedAt: true,
              players: {
                select: { id: true, role: true, missCount: true },
              },
            },
          });

          if (!liveRoom || liveRoom.status !== 'PLAYING' || !liveRoom.currentTurn || !liveRoom.turnStartedAt) {
            return;
          }

          const latestDiff = now.getTime() - liveRoom.turnStartedAt.getTime();
          if (latestDiff <= timeoutMs) {
            return;
          }

          const currentPlayer = liveRoom.players.find((p) => p.role === liveRoom.currentTurn);
          const opponentRole = liveRoom.currentTurn === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
          const opponent = liveRoom.players.find((p) => p.role === opponentRole);
          if (!currentPlayer || !opponent) return;

          const updatedPlayer = await tx.playerInRoom.update({
            where: { id: currentPlayer.id },
            data: { missCount: currentPlayer.missCount + 1 },
            select: { missCount: true },
          });

          if (updatedPlayer.missCount >= 3) {
            await tx.room.update({
              where: { id: liveRoom.id },
              data: {
                status: 'FINISHED',
                endReason: 'MISS_LIMIT',
                winnerRole: opponent.role,
                finishedAt: now,
                currentTurn: null,
              },
            });
            return;
          }

          await tx.room.update({
            where: { id: liveRoom.id },
            data: {
              currentTurn: opponent.role,
              turnStartedAt: now,
            },
          });
        });

        room = await this.prisma.room.findUnique({
          where: { code },
          select: {
            id: true,
            code: true,
            codeLength: true,
            status: true,
            currentTurn: true,
            currentRound: true,
            turnStartedAt: true,
            endReason: true,
            winnerRole: true,
            players: {
              select: {
                id: true,
                nickname: true,
                role: true,
                missCount: true,
              },
              orderBy: { createdAt: 'asc' },
            },
            guesses: {
              select: {
                id: true,
                playerInRoomId: true,
                guessValue: true,
                roundIndex: true,
                turnIndex: true,
                correctDigits: true,
                correctPositions: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        });
      }
    }

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    const lastGuess = room.guesses[0] ?? null;

    return {
      message: 'Lấy trạng thái phòng thành công',
      data: {
        room: {
          code: room.code,
          codeLength: room.codeLength,
          status: room.status,
          currentTurn: room.currentTurn,
          currentRound: room.currentRound,
          turnStartedAt: room.turnStartedAt,
          endReason: room.endReason,
          winnerRole: room.winnerRole,
        },
        players: room.players,
        lastGuess,
      },
    };
  }

  async createRoom(data: CreateRoomDto, hostId: string, hostUsername?: string) {
    const code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    const result = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: { code, codeLength: data.codeLength, hostId },
        select: {
          id: true,
          code: true,
          codeLength: true,
          status: true,
          hostId: true,
        },
      });

      const hostPlayer = await tx.playerInRoom.create({
        data: {
          roomId: room.id,
          userId: hostId,
          nickname: (hostUsername?.trim() || 'host'),
          role: 'PLAYER_1',
        },
        select: {
          id: true,
          nickname: true,
          role: true,
          missCount: true,
          roomId: true,
          userId: true,
        },
      });

      return { room, hostPlayer };
    });

    const response = {
      message: 'Tạo phòng thành công',
      data: result,
    };

    await this.ablyService.publishRoomEvent(
      response.data.room.code,
      'ROOM_CREATED',
      {
        room: response.data.room,
        hostPlayer: response.data.hostPlayer,
      },
    );

    return response;
  }

  async joinRoom(roomCode: string, nickname: string) {
    const code = roomCode.trim();
    if (!code) {
      throw new BadRequestException('Mã phòng không được để trống');
    }

    const nicknameTrimmed = nickname.trim();
    if (!nicknameTrimmed) {
      throw new BadRequestException('Nickname không được để trống');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { code },
        select: {
          id: true,
          code: true,
          codeLength: true,
          status: true,
          currentTurn: true,
          currentRound: true,
          endReason: true,
          winnerRole: true,
          players: {
            select: { id: true, nickname: true, role: true, missCount: true },
          },
        },
      });

      if (!room) {
        throw new NotFoundException('Không tìm thấy phòng');
      }

      if (room.status === 'FINISHED') {
        throw new BadRequestException('Phòng đã kết thúc');
      }

      if (room.players.length >= 2) {
        throw new BadRequestException('Phòng đã đủ người');
      }

      const normalizedNickname = nicknameTrimmed.toLowerCase();
      const hasDuplicateNickname = room.players.some(
        (p) => p.nickname.trim().toLowerCase() === normalizedNickname,
      );
      if (hasDuplicateNickname) {
        throw new BadRequestException('Nickname đã tồn tại trong phòng');
      }

      const existingRoles = new Set(room.players.map((p) => p.role));
      const role = existingRoles.has('PLAYER_1') ? 'PLAYER_2' : 'PLAYER_1';

      const player = await tx.playerInRoom.create({
        data: {
          roomId: room.id,
          nickname: nicknameTrimmed,
          role,
          userId: null,
        },
        select: {
          id: true,
          nickname: true,
          role: true,
          missCount: true,
          roomId: true,
        },
      });

      return {
        message: 'Join room thành công',
        data: {
          room: {
            code: room.code,
            codeLength: room.codeLength,
            status: room.status,
            currentTurn: room.currentTurn,
            currentRound: room.currentRound,
            endReason: room.endReason,
            winnerRole: room.winnerRole,
          },
          player,
          players: [...room.players, player].map((p) => ({
            id: p.id,
            nickname: p.nickname,
            role: p.role,
            missCount: p.missCount,
          })),
        },
      };
    });

    const response = result;
    await this.ablyService.publishRoomEvent(response.data.room.code, 'PLAYER_JOINED', {
      player: response.data.player,
      players: response.data.players,
    });
    return response;
  }

  async startRoom(roomCode: string, playerId: string) {
    const code = roomCode.trim();
    if (!code) {
      throw new BadRequestException('Mã phòng không được để trống');
    }
    if (!playerId?.trim()) {
      throw new BadRequestException('Thiếu playerId');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { code },
        select: {
          id: true,
          code: true,
          codeLength: true,
          status: true,
          players: {
            select: { id: true, role: true, nickname: true, secretCode: true, missCount: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!room) {
        throw new NotFoundException('Không tìm thấy phòng');
      }

      if (room.status === 'FINISHED') {
        throw new BadRequestException('Phòng đã kết thúc');
      }

      if (room.players.length !== 2) {
        throw new BadRequestException('Cần đủ 2 người để bắt đầu');
      }

      if (room.status !== 'WAITING') {
        throw new BadRequestException('Phòng không ở trạng thái chờ');
      }

      const me = room.players.find((p) => p.id === playerId);
      if (!me) {
        throw new NotFoundException('Không tìm thấy người chơi trong phòng');
      }

      if (me.role !== 'PLAYER_1') {
        throw new BadRequestException('Chỉ chủ phòng (PLAYER_1) mới được bắt đầu');
      }

      const updated = await tx.room.update({
        where: { id: room.id },
        data: { status: 'SETTING_SECRET' },
        select: { status: true },
      });

      return {
        message: 'Bắt đầu thành công',
        data: {
          room: {
            code: room.code,
            codeLength: room.codeLength,
            status: updated.status,
          },
          players: room.players.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            role: p.role,
            missCount: p.missCount,
            secretSet: !!p.secretCode,
          })),
        },
      };
    });

    await this.ablyService.publishRoomEvent(result.data.room.code, 'ROOM_STARTED', {
      room: result.data.room,
      players: result.data.players,
    });

    return result;
  }

  async leaveRoom(
    roomCode: string,
    params: { playerId?: string; userId?: string },
  ) {
    const code = roomCode.trim();
    if (!code) {
      throw new BadRequestException('Mã phòng không được để trống');
    }

    const { playerId, userId } = params;
    if (!playerId && !userId) {
      throw new BadRequestException('Thiếu thông tin người rời phòng');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { code },
        select: {
          id: true,
          code: true,
          status: true,
          currentTurn: true,
          currentRound: true,
          turnStartedAt: true,
          players: { select: { id: true, role: true, userId: true } },
        },
      });

      if (!room) {
        throw new NotFoundException('Không tìm thấy phòng');
      }

      const player = playerId
        ? room.players.find((p) => p.id === playerId)
        : room.players.find((p) => p.userId === userId);

      if (!player) {
        throw new NotFoundException('Không tìm thấy người chơi trong phòng');
      }

      await tx.playerInRoom.delete({ where: { id: player.id } });

      const remaining = room.players.filter((p) => p.id !== player.id);

      // end game if no palyer
      if (remaining.length === 0) {
        await tx.room.update({
          where: { id: room.id },
          data: {
            status: 'FINISHED',
            endReason: 'ABANDONED',
            winnerRole: null,
            finishedAt: new Date(),
            currentTurn: null,
          },
        });
      } else if (remaining.length === 1) {
        // Avoid "kẹt lượt" khi người đang tới lượt rời phòng.
        // Khi chỉ còn 1 người, cho phòng quay lại WAITING để chờ đối thủ.
        const remainingPlayerRole = remaining[0].role;
        if (room.status === 'PLAYING' && room.currentTurn === remainingPlayerRole) {
          await tx.room.update({
            where: { id: room.id },
            data: {
              status: 'WAITING',
              currentTurn: null,
              currentRound: 1,
              turnStartedAt: null,
              endReason: null,
              winnerRole: null,
              finishedAt: null,
            },
          });
        } else if (room.status === 'PLAYING') {
          await tx.room.update({
            where: { id: room.id },
            data: {
              status: 'WAITING',
              currentTurn: null,
              currentRound: 1,
              turnStartedAt: null,
              endReason: null,
              winnerRole: null,
              finishedAt: null,
            },
          });
        }
      }

      return {
        message: 'Rời phòng thành công',
        data: {
          roomCode: room.code,
          leftPlayerId: player.id,
          remainingCount: remaining.length,
        },
      };
    });

    const response = result;
    await this.ablyService.publishRoomEvent(response.data.roomCode, 'PLAYER_LEFT', {
      leftPlayerId: response.data.leftPlayerId,
      remainingCount: response.data.remainingCount,
    });

    if (response.data.remainingCount === 0) {
      await this.ablyService.publishRoomEvent(response.data.roomCode, 'GAME_FINISHED', {
        endReason: 'ABANDONED',
        winnerRole: null,
      });
    }

    return response;
  }

  async setSecret(roomCode: string, playerId: string, secretCode: string) {
    const code = roomCode.trim();
    if (!code) {
      throw new BadRequestException('Mã phòng không được để trống');
    }

    const normalizedSecret = secretCode.trim();
    if (!normalizedSecret) {
      throw new BadRequestException('Mật mã không được để trống');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { code },
        select: {
          id: true,
          code: true,
          codeLength: true,
          status: true,
          currentTurn: true,
          currentRound: true,
          players: {
            select: {
              id: true,
              role: true,
              nickname: true,
              secretCode: true,
            },
          },
        },
      });

      if (!room) {
        throw new NotFoundException('Không tìm thấy phòng');
      }

      if (room.status === 'FINISHED') {
        throw new BadRequestException('Phòng đã kết thúc');
      }

      if (!/^\d+$/.test(normalizedSecret)) {
        throw new BadRequestException('Mật mã chỉ được chứa chữ số');
      }

      if (normalizedSecret.length !== room.codeLength) {
        throw new BadRequestException(`Mật mã phải có đúng ${room.codeLength} chữ số`);
      }

      const me = room.players.find((p) => p.id === playerId);
      if (!me) {
        throw new NotFoundException('Không tìm thấy người chơi trong phòng');
      }

      await tx.playerInRoom.update({
        where: { id: playerId },
        data: { secretCode: normalizedSecret },
      });

      const refreshedPlayers = await tx.playerInRoom.findMany({
        where: { roomId: room.id },
        select: {
          id: true,
          role: true,
          nickname: true,
          secretCode: true,
          missCount: true,
        },
      });

      const hasTwoPlayers = refreshedPlayers.length === 2;
      const allSecretSet = hasTwoPlayers && refreshedPlayers.every((p) => !!p.secretCode);

      let nextStatus: string = room.status;
      let currentTurn: string | null = room.currentTurn;
      let currentRound: number = room.currentRound;

      if (allSecretSet) {
        const updatedRoom = await tx.room.update({
          where: { id: room.id },
          data: {
            status: 'PLAYING',
            currentTurn: 'PLAYER_1',
            currentRound: 1,
            startedAt: room.status === 'PLAYING' ? undefined : new Date(),
            turnStartedAt: new Date(),
          },
          select: { status: true, currentTurn: true, currentRound: true },
        });
        nextStatus = updatedRoom.status;
        currentTurn = updatedRoom.currentTurn;
        currentRound = updatedRoom.currentRound;
      } else if (hasTwoPlayers && room.status === 'WAITING') {
        const updatedRoom = await tx.room.update({
          where: { id: room.id },
          data: { status: 'SETTING_SECRET' },
          select: { status: true },
        });
        nextStatus = updatedRoom.status;
      }

      return {
        message: 'Nhập mật mã thành công',
        data: {
          room: {
            code: room.code,
            codeLength: room.codeLength,
            status: nextStatus,
            currentTurn,
            currentRound,
          },
          me: {
            id: me.id,
            role: me.role,
            nickname: me.nickname,
            secretSet: true,
          },
          players: refreshedPlayers.map((p) => ({
            id: p.id,
            role: p.role,
            nickname: p.nickname,
            secretSet: !!p.secretCode,
            missCount: p.missCount,
          })),
        },
      };
    });

    const response = result;
    await this.ablyService.publishRoomEvent(response.data.room.code, 'SECRET_SET', {
      room: response.data.room,
      me: response.data.me,
      players: response.data.players,
    });
    return response;
  }

  async guess(roomCode: string, playerId: string, guessValue: string) {
    const code = roomCode.trim();
    if (!code) {
      throw new BadRequestException('Mã phòng không được để trống');
    }

    const normalizedGuess = guessValue.trim();
    if (!normalizedGuess) {
      throw new BadRequestException('Giá trị đoán không được để trống');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { code },
        select: {
          id: true,
          code: true,
          codeLength: true,
          status: true,
          currentTurn: true,
          currentRound: true,
          endReason: true,
          winnerRole: true,
          turnStartedAt: true,
          players: {
            select: { id: true, role: true, nickname: true, secretCode: true, missCount: true },
          },
          guesses: {
            select: { id: true, turnIndex: true },
            orderBy: { turnIndex: 'desc' },
            take: 1,
          },
        },
      });

      if (!room) {
        throw new NotFoundException('Không tìm thấy phòng');
      }

      if (room.status !== 'PLAYING') {
        throw new BadRequestException('Phòng chưa ở trạng thái chơi');
      }

      if (!room.currentTurn) {
        throw new BadRequestException('Phòng không có lượt hiện tại');
      }

      // Check timeout 5 phút: nếu quá 5 phút kể từ turnStartedAt thì tự động +miss cho currentTurn và chuyển lượt.
      if (room.turnStartedAt) {
        const now = new Date();
        const diffMs = now.getTime() - room.turnStartedAt.getTime();
        const timeoutMs = 2 * 60 * 1000;

        if (diffMs > timeoutMs) {
          const currentPlayer = room.players.find((p) => p.role === room.currentTurn);
          const opponentRole = room.currentTurn === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
          const opponent = room.players.find((p) => p.role === opponentRole);

          if (currentPlayer && opponent) {
            const updatedPlayer = await tx.playerInRoom.update({
              where: { id: currentPlayer.id },
              data: { missCount: currentPlayer.missCount + 1 },
              select: { missCount: true, role: true },
            });

            // Nếu vượt MISS_LIMIT (3) => kết thúc game
            if (updatedPlayer.missCount >= 3) {
              const finished = await tx.room.update({
                where: { id: room.id },
                data: {
                  status: 'FINISHED',
                  endReason: 'MISS_LIMIT',
                  winnerRole: opponent.role,
                  finishedAt: now,
                  currentTurn: null,
                },
                select: { status: true, endReason: true, winnerRole: true },
              });

              return {
                message: 'Hết giờ lượt chơi, game kết thúc do quá số lần miss',
                data: {
                  room: {
                    code: room.code,
                    status: finished.status,
                    endReason: finished.endReason,
                    winnerRole: finished.winnerRole,
                  },
                },
              };
            }

            // Chuyển lượt do timeout, không cho đoán nữa
            await tx.room.update({
              where: { id: room.id },
              data: {
                currentTurn: opponent.role,
                turnStartedAt: now,
              },
            });

            throw new BadRequestException('Hết thời gian cho lượt trước, đã chuyển lượt');
          }
        }
      }

      if (!/^\d+$/.test(normalizedGuess)) {
        throw new BadRequestException('Giá trị đoán chỉ được chứa chữ số');
      }

      if (normalizedGuess.length !== room.codeLength) {
        throw new BadRequestException(`Giá trị đoán phải có đúng ${room.codeLength} chữ số`);
      }

      const me = room.players.find((p) => p.id === playerId);
      if (!me) {
        throw new NotFoundException('Không tìm thấy người chơi trong phòng');
      }

      if (me.role !== room.currentTurn) {
        throw new BadRequestException('Chưa đến lượt của bạn');
      }

      const opponentRole = me.role === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
      const opponent = room.players.find((p) => p.role === opponentRole);
      if (!opponent) {
        throw new BadRequestException('Chưa đủ người chơi để đoán');
      }

      if (!opponent.secretCode) {
        throw new BadRequestException('Đối thủ chưa nhập mật mã');
      }

      const { correctDigits, correctPositions } = calculateGuessResult(opponent.secretCode, normalizedGuess);

      const lastTurnIndex = room.guesses[0]?.turnIndex ?? 0;
      const turnIndex = lastTurnIndex + 1;
      const roundIndex = room.currentRound;

      const guess = await tx.guess.create({
        data: {
          roomId: room.id,
          playerInRoomId: me.id,
          roundIndex,
          turnIndex,
          guessValue: normalizedGuess,
          correctDigits,
          correctPositions,
        },
      });

      // Fair turn rule: chỉ kết thúc sau khi cả hai đã đoán trong round hiện tại
      const host = room.players.find((p) => p.role === 'PLAYER_1');
      const guest = room.players.find((p) => p.role === 'PLAYER_2');

      if (host && guest && me.role === 'PLAYER_2') {
        // Vừa kết thúc lượt của PLAYER_2, kiểm tra kết quả round hiện tại
        const [p1Guess, p2Guess] = await Promise.all([
          tx.guess.findFirst({
            where: {
              roomId: room.id,
              roundIndex,
              playerInRoomId: host.id,
            },
            orderBy: { createdAt: 'desc' },
          }),
          tx.guess.findFirst({
            where: {
              roomId: room.id,
              roundIndex,
              playerInRoomId: guest.id,
            },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        if (p1Guess && p2Guess) {
          const p1Full = p1Guess.correctPositions === room.codeLength;
          const p2Full = p2Guess.correctPositions === room.codeLength;

          if (p1Full || p2Full) {
            // Ít nhất một bên đoán đúng full code trong round này
            let winnerRole: 'PLAYER_1' | 'PLAYER_2' | null = null;

            if (p1Full && !p2Full) {
              winnerRole = 'PLAYER_1';
            } else if (!p1Full && p2Full) {
              winnerRole = 'PLAYER_2';
            } else {
              // Cả hai cùng full code => hoà
              winnerRole = null;
            }

            const endReason = winnerRole ? 'FULL_CODE_WIN' : 'MAX_ROUNDS_TIE';

            const finished = await tx.room.update({
              where: { id: room.id },
              data: {
                status: 'FINISHED',
                endReason,
                winnerRole,
                finishedAt: new Date(),
                currentTurn: null,
              },
              select: { status: true, endReason: true, winnerRole: true },
            });

            return {
              message: 'Đoán thành công',
              data: {
                result: { correctDigits, correctPositions },
                turnIndex,
                roundIndex,
                room: {
                  code: room.code,
                  status: finished.status,
                  endReason: finished.endReason,
                  winnerRole: finished.winnerRole,
                },
              },
            };
          }
        }
      }

      // Nếu chưa kết thúc game, chuyển lượt / round như cũ
      const nextTurn = opponentRole;
      const nextRound = me.role === 'PLAYER_2' ? room.currentRound + 1 : room.currentRound;

      // Max rounds tie (basic): nếu đã vượt round tối đa thì hoà
      if (nextRound > 10) {
        const finished = await tx.room.update({
          where: { id: room.id },
          data: {
            status: 'FINISHED',
            endReason: 'MAX_ROUNDS_TIE',
            winnerRole: null,
            finishedAt: new Date(),
            currentTurn: null,
          },
          select: { status: true, endReason: true, winnerRole: true },
        });

        return {
          message: 'Hết lượt',
          data: {
            result: { correctDigits, correctPositions },
            turnIndex,
            roundIndex,
            room: {
              code: room.code,
              status: finished.status,
              endReason: finished.endReason,
              winnerRole: finished.winnerRole,
            },
          },
        };
      }

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentTurn: nextTurn,
          currentRound: nextRound,
          turnStartedAt: new Date(),
        },
      });

      return {
        message: 'Đoán thành công',
        data: {
          result: { correctDigits, correctPositions },
          turnIndex,
          roundIndex,
          nextTurn,
          nextRound,
        },
      };
    });

    const response = result;

    await this.ablyService.publishRoomEvent(response.data?.room?.code ?? code, 'GUESS_MADE', {
      result: response.data.result,
      turnIndex: response.data.turnIndex,
      roundIndex: response.data.roundIndex,
      nextTurn: response.data.nextTurn,
      nextRound: response.data.nextRound,
    });

    if (response.data?.room?.status === 'FINISHED') {
      const finishedRoom = response.data.room;
      await this.ablyService.publishRoomEvent(finishedRoom.code, 'GAME_FINISHED', {
        endReason: finishedRoom.endReason,
        winnerRole: finishedRoom.winnerRole,
      });
    }

    return response;
  }


}
