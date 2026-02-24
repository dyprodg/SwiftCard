/**
 * Valid order status transitions (state machine).
 * Key = current status, Value = array of allowed next statuses.
 */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

/**
 * Statuses that are set automatically by server actions (not manually by admin).
 * These should be filtered out of the admin status dropdown.
 */
export const AUTOMATED_TRANSITIONS = ["REFUNDED"];

export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string,
): boolean {
  const allowed = ORDER_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}
