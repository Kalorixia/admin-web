import { auditRows, type AuditRow } from "@/services/mocks/audit.mock"
import { delay, newId } from "@/services/mockUtils"

export type { AuditRow }

export interface LogAuditInput {
  action: string
  entity_type: string
  entity_id?: string | null
  metadata?: Record<string, unknown>
  actor_name?: string | null
}

export const auditService = {
  async list(limit = 500): Promise<AuditRow[]> {
    return delay(auditRows.slice(0, limit))
  },

  async log(entry: LogAuditInput): Promise<void> {
    auditRows.unshift({
      id: newId("audit"),
      actor_name: entry.actor_name ?? "Admin Demo",
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      metadata: entry.metadata ?? {},
      created_at: new Date().toISOString(),
    })
    await delay(undefined, 50)
  },
}
