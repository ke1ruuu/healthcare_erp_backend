import type { Prisma } from '@prisma/client'
import { prisma } from '@/db/prisma'

export interface CreateAuditLogParams {
  userId?: string | null
  action: string
  entity: string
  entityId?: string | null
  details?: Prisma.InputJsonValue
  ipAddress?: string | null
  userAgent?: string | null
}

export interface IAuditLogRepository {
  create(params: CreateAuditLogParams): Promise<void>
}

export class AuditLogRepository implements IAuditLogRepository {
  async create(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId ?? null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId ?? null,
          details: params.details,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        },
      })
    } catch {
      // Non-blocking audit logger
    }
  }
}

export const auditLogRepository = new AuditLogRepository()
