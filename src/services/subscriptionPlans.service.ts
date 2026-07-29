import {
  subscriptionPlans,
  type SubscriptionPlan,
} from "@/services/mocks/subscriptionPlans.mock"
import { auditService } from "@/services/audit.service"
import { delay, newId } from "@/services/mockUtils"

export type { SubscriptionPlan }

export type SubscriptionPlanInput = Omit<SubscriptionPlan, "id">

export const subscriptionPlansService = {
  async list(): Promise<SubscriptionPlan[]> {
    return delay(
      [...subscriptionPlans].sort((a, b) => a.price_monthly - b.price_monthly)
    )
  },

  async create(input: SubscriptionPlanInput): Promise<SubscriptionPlan> {
    const plan: SubscriptionPlan = { ...input, id: newId("plan") }
    subscriptionPlans.push(plan)
    await auditService.log({
      action: "plan_created",
      entity_type: "plan",
      entity_id: plan.id,
    })
    return delay(plan, 50)
  },

  async update(
    id: string,
    input: SubscriptionPlanInput
  ): Promise<SubscriptionPlan> {
    const index = subscriptionPlans.findIndex((p) => p.id === id)
    if (index === -1) throw new Error("Plan no encontrado")
    const updated: SubscriptionPlan = { ...input, id }
    subscriptionPlans[index] = updated
    await auditService.log({
      action: "plan_updated",
      entity_type: "plan",
      entity_id: id,
    })
    return delay(updated, 50)
  },

  async toggleActive(id: string): Promise<SubscriptionPlan> {
    const plan = subscriptionPlans.find((p) => p.id === id)
    if (!plan) throw new Error("Plan no encontrado")
    plan.active = !plan.active
    await auditService.log({
      action: plan.active ? "plan_activated" : "plan_deactivated",
      entity_type: "plan",
      entity_id: id,
    })
    return delay(plan, 50)
  },
}
