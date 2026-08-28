import type { Context, Next, MiddlewareHandler } from 'hono'
import { Role } from '@prisma/client'
import { authService, type SessionUser } from '@/modules/auth'
import { prisma } from '@/db/prisma'
import {
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@/shared/exceptions/app.exception'

/**
 * Authentication Middleware
 * Enforces valid Bearer JWT access token, validates session against DB/user status,
 * attaches SessionUser to context, and resolves active Organization and Branch contexts.
 */
export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('authorization') || c.req.header('Authorization')

  if (!authHeader) {
    throw new UnauthorizedException(
      'Missing Authorization header. Expected: Bearer <token>',
      'MISSING_AUTHORIZATION_HEADER'
    )
  }

  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedException(
      'Malformed Authorization header. Format must be: Bearer <token>',
      'INVALID_TOKEN_FORMAT'
    )
  }

  const user = await authService.validateSession(token)

  c.set('user', user)
  c.set('userId', user.id)

  // 1. Resolve Organization Context
  const targetOrgId =
    c.req.header('x-organization-id') ||
    c.req.header('X-Organization-ID') ||
    user.organizationId

  if (targetOrgId) {
    // If user has organization object already cached from user profile
    if (user.organization && user.organization.id === targetOrgId) {
      c.set('organization', user.organization)
      c.set('organizationId', user.organization.id)
    } else {
      const org = await prisma.organization.findFirst({
        where: { id: targetOrgId, deletedAt: null },
      })
      if (org) {
        c.set('organization', {
          id: org.id,
          name: org.name,
          code: org.code,
          status: org.status,
        })
        c.set('organizationId', org.id)
      }
    }
  }

  // 2. Resolve Branch Context
  const targetBranchId =
    c.req.header('x-branch-id') ||
    c.req.header('X-Branch-ID') ||
    user.branchId

  if (targetBranchId) {
    if (user.branch && user.branch.id === targetBranchId) {
      c.set('branch', user.branch)
      c.set('branchId', user.branch.id)
    } else {
      const branch = await prisma.branch.findFirst({
        where: { id: targetBranchId, deletedAt: null },
      })
      if (branch) {
        c.set('branch', {
          id: branch.id,
          organizationId: branch.organizationId,
          name: branch.name,
          code: branch.code,
          status: branch.status,
        })
        c.set('branchId', branch.id)
      }
    }
  }

  await next()
}

/**
 * Organization Tenant Guard Middleware
 * Strictly requires that a valid, active Organization context is present.
 */
export async function requireOrganization(c: Context, next: Next): Promise<Response | void> {
  const user = c.get('user') as SessionUser | undefined

  if (!user) {
    throw new UnauthorizedException(
      'Authentication required before organization context validation',
      'UNAUTHORIZED'
    )
  }

  let orgId = c.get('organizationId')

  if (!orgId) {
    orgId =
      c.req.header('x-organization-id') ||
      c.req.header('X-Organization-ID') ||
      user.organizationId ||
      undefined
  }

  if (!orgId) {
    throw new BadRequestException(
      'Missing organization context. Provide X-Organization-ID header.',
      'MISSING_ORGANIZATION_CONTEXT'
    )
  }

  let org = c.get('organization')
  if (!org || org.id !== orgId) {
    const dbOrg = await prisma.organization.findFirst({
      where: { id: orgId, deletedAt: null },
    })

    if (!dbOrg) {
      throw new NotFoundException(
        `Organization '${orgId}' not found`,
        'ORGANIZATION_NOT_FOUND'
      )
    }

    org = {
      id: dbOrg.id,
      name: dbOrg.name,
      code: dbOrg.code,
      status: dbOrg.status,
    }
    c.set('organization', org)
    c.set('organizationId', org.id)
  }

  if (org.status !== 'ACTIVE') {
    throw new ForbiddenException(
      'The requested organization is currently inactive',
      'ORGANIZATION_INACTIVE'
    )
  }

  // Cross-tenant access validation: Non-SUPER_ADMIN users cannot access foreign organizations
  if (user.role !== Role.SUPER_ADMIN && user.organizationId && user.organizationId !== org.id) {
    throw new ForbiddenException(
      'You are not authorized to access this organization',
      'FORBIDDEN_ORGANIZATION_ACCESS'
    )
  }

  await next()
}

/**
 * Branch Facility Guard Middleware
 * Strictly requires that a valid, active Branch context is present and matches the active Organization.
 */
export async function requireBranch(c: Context, next: Next): Promise<Response | void> {
  const user = c.get('user') as SessionUser | undefined

  if (!user) {
    throw new UnauthorizedException(
      'Authentication required before branch context validation',
      'UNAUTHORIZED'
    )
  }

  let branchId = c.get('branchId')

  if (!branchId) {
    branchId =
      c.req.header('x-branch-id') ||
      c.req.header('X-Branch-ID') ||
      user.branchId ||
      undefined
  }

  if (!branchId) {
    throw new BadRequestException(
      'Missing branch context. Provide X-Branch-ID header.',
      'MISSING_BRANCH_CONTEXT'
    )
  }

  let branch = c.get('branch')
  if (!branch || branch.id !== branchId) {
    const dbBranch = await prisma.branch.findFirst({
      where: { id: branchId, deletedAt: null },
    })

    if (!dbBranch) {
      throw new NotFoundException(
        `Branch '${branchId}' not found`,
        'BRANCH_NOT_FOUND'
      )
    }

    branch = {
      id: dbBranch.id,
      organizationId: dbBranch.organizationId,
      name: dbBranch.name,
      code: dbBranch.code,
      status: dbBranch.status,
    }
    c.set('branch', branch)
    c.set('branchId', branch.id)
  }

  if (branch.status !== 'ACTIVE') {
    throw new ForbiddenException(
      'The requested branch facility is currently inactive',
      'BRANCH_INACTIVE'
    )
  }

  // Verify branch belongs to current organization if organization context is present
  const orgId = c.get('organizationId')
  if (orgId && branch.organizationId !== orgId) {
    throw new BadRequestException(
      `Branch '${branch.name}' does not belong to the active organization`,
      'BRANCH_ORGANIZATION_MISMATCH'
    )
  }

  // Cross-branch access validation:
  // SUPER_ADMIN and ADMIN have access across all branches in their organization.
  // Other staff roles are restricted to their assigned branch if explicitly configured.
  if (
    user.role !== Role.SUPER_ADMIN &&
    user.role !== Role.ADMIN &&
    user.branchId &&
    user.branchId !== branch.id
  ) {
    throw new ForbiddenException(
      'You are not authorized to access this branch facility',
      'FORBIDDEN_BRANCH_ACCESS'
    )
  }

  await next()
}

/**
 * Tenant Context Middleware (Organization + Branch)
 * Composed helper to enforce both Organization and Branch validation on facility-specific routes.
 */
export const requireTenantContext: MiddlewareHandler = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  await requireOrganization(c, async () => {
    await requireBranch(c, next)
  })
}

/**
 * Role-Based Access Control (RBAC) Guard Middleware
 * Restricts route execution to users possessing one of the allowed roles.
 */
export function requireRoles(...allowedRoles: Role[]): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as SessionUser | undefined

    if (!user) {
      throw new UnauthorizedException(
        'Authentication required before role verification',
        'UNAUTHORIZED'
      )
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Allowed roles: [${allowedRoles.join(', ')}]. Current role: [${user.role}]`,
        'INSUFFICIENT_PERMISSIONS'
      )
    }

    await next()
  }
}

/**
 * Optional Authentication Middleware
 * Extracts and sets session user if a valid Bearer token is provided, without rejecting unauthenticated requests.
 */
export async function optionalAuth(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('authorization') || c.req.header('Authorization')

  if (authHeader) {
    const [scheme, token] = authHeader.split(' ')
    if (scheme === 'Bearer' && token) {
      try {
        const user = await authService.validateSession(token)
        c.set('user', user)
        c.set('userId', user.id)
      } catch {
        // Ignore errors in optional authentication
      }
    }
  }

  await next()
}
