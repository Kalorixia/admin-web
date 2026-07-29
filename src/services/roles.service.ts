import {
  permissions,
  rolePermissions,
  type AppRole,
  type Permission,
} from "@/services/mocks/roles.mock"
import { auditService } from "@/services/audit.service"
import { delay } from "@/services/mockUtils"

export type { AppRole, Permission }

export const rolesService = {
  async listPermissions(): Promise<Permission[]> {
    return delay([...permissions].sort((a, b) => a.code.localeCompare(b.code)))
  },

  async listRolePermissions(): Promise<
    { role: AppRole; permission_code: string }[]
  > {
    return delay([...rolePermissions])
  },

  async togglePermission(role: AppRole, code: string): Promise<void> {
    const index = rolePermissions.findIndex(
      (rp) => rp.role === role && rp.permission_code === code
    )
    const has = index !== -1
    if (has) {
      rolePermissions.splice(index, 1)
    } else {
      rolePermissions.push({ role, permission_code: code })
    }
    await auditService.log({
      action: has ? "role.revoke" : "role.grant",
      entity_type: "role",
      entity_id: role,
      metadata: { permission: code },
    })
    await delay(undefined, 50)
  },
}
