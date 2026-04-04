import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User không tồn tại');

    const rooms = await this.prisma.room.findMany({
      where: {
        finishedAt: { not: null },
        players: { some: { userId } },
      },
      select: {
        winnerRole: true,
        players: { select: { role: true, userId: true } },
      },
    });

    let winCount = 0;
    let lossCount = 0;
    let drawCount = 0;
    for (const r of rooms) {
      const my = r.players.find((p) => p.userId === userId);
      if (!my) continue;
      if (r.winnerRole === null) {
        drawCount += 1;
      } else if (r.winnerRole === my.role) {
        winCount += 1;
      } else {
        lossCount += 1;
      }
    }

    return { ...user, winCount, lossCount, drawCount };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException('User không tồn tại');

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) throw new BadRequestException('Mật khẩu cũ không chính xác');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
    return { message: 'Đổi mật khẩu thành công' };
  }

  async changeUsername(userId: string, username: string) {
    const normalized = username.trim();
    if (!normalized) throw new BadRequestException('Username không hợp lệ');

    const exists = await this.prisma.user.findUnique({
      where: { username: normalized },
      select: { id: true },
    });
    if (exists && exists.id !== userId) {
      throw new ConflictException('Username đã tồn tại');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { username: normalized },
    });
    return { message: 'Cập nhật username thành công' };
  }

  async getRecentHistory(userId: string, limit = 10) {
    const rooms = await this.prisma.room.findMany({
      where: {
        finishedAt: { not: null },
        OR: [
          { hostId: userId },
          { players: { some: { userId } } },
        ],
      },
      orderBy: { finishedAt: 'desc' },
      take: limit,
      select: {
        code: true,
        status: true,
        endReason: true,
        winnerRole: true,
        finishedAt: true,
        currentRound: true,
        players: {
          select: { role: true, nickname: true, userId: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return rooms;
  }

  async getRanking(limit = 20) {
    const rooms = await this.prisma.room.findMany({
      where: { finishedAt: { not: null }, winnerRole: { not: null } },
      select: { winnerRole: true, players: { select: { role: true, userId: true } } },
    });

    const winMap = new Map<string, number>();
    for (const r of rooms) {
      const winner = r.players.find((p) => p.role === (r.winnerRole as any) && p.userId);
      if (!winner?.userId) continue;
      winMap.set(winner.userId, (winMap.get(winner.userId) ?? 0) + 1);
    }

    const sorted = Array.from(winMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.max(1, Math.min(limit, 100)));

    const users = await this.prisma.user.findMany({
      where: { id: { in: sorted.map(([id]) => id) } },
      select: { id: true, username: true, email: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return sorted.map(([userId, wins], idx) => ({
      rank: idx + 1,
      userId,
      username: userById.get(userId)?.username ?? (userById.get(userId)?.email?.split('@')[0] ?? 'User'),
      wins,
    }));
  }
}

