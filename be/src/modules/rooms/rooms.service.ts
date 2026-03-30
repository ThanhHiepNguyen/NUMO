import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) { }

  async getRoomByCode(roomCode: string) {
    const code = roomCode.trim();
    if (!code) {
      throw new BadRequestException('Mã phòng không được để trống');
    }

    const room = await this.prisma.room.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        codeLength: true,
        status: true,
        hostId: true,
        currentTurn: true,
        currentRound: true,
        turnStartedAt: true,
        endReason: true,
        winnerRole: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
        players: {
          select: {
            id: true,
            userId: true,
            nickname: true,
            role: true,
            missCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    return {
      message: 'Lấy thông tin phòng thành công',
      data: room,
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

    return {
      message: 'Tạo phòng thành công',
      data: result,
    };
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

    return result;
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

    return result;
  }


}
