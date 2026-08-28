import type { Session, Prisma } from '@prisma/client'
import { prisma } from '@/db/prisma'

export interface ISessionRepository {
  createSession(data: Prisma.SessionUncheckedCreateInput): Promise<Session>
  findByRefreshToken(token: string): Promise<(Session & { user: { id: string; email: string; firstName: string; lastName: string; role: any; status: any; deletedAt: Date | null } }) | null>
  revokeSession(token: string): Promise<Session | null>
  revokeAllUserSessions(userId: string): Promise<number>
  deleteExpiredSessions(): Promise<number>
}

export class SessionRepository implements ISessionRepository {
  async createSession(data: Prisma.SessionUncheckedCreateInput): Promise<Session> {
    return prisma.session.create({ data })
  }

  async findByRefreshToken(token: string) {
    return prisma.session.findUnique({
      where: { refreshToken: token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    })
  }

  async revokeSession(token: string): Promise<Session | null> {
    try {
      return await prisma.session.update({
        where: { refreshToken: token },
        data: { revokedAt: new Date() },
      })
    } catch {
      return null
    }
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return result.count
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    })
    return result.count
  }
}

export const sessionRepository = new SessionRepository()
