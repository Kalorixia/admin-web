import {
  subscriptionRows,
  type SubscriptionRow,
} from "@/services/mocks/subscriptions.mock"
import { delay } from "@/services/mockUtils"

export type { SubscriptionRow }

export const subscriptionsService = {
  async list(): Promise<SubscriptionRow[]> {
    return delay(
      [...subscriptionRows].sort((a, b) =>
        b.started_at.localeCompare(a.started_at)
      )
    )
  },
}
