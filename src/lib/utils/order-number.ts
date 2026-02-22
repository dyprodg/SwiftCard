/**
 * Generate an order number in format: SC-YYYYMMDD-XXXX
 * The sequential part should be handled atomically in the database.
 * This helper generates the date prefix.
 */
export function generateOrderNumber(sequenceNumber: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const seq = String(sequenceNumber).padStart(4, "0");
  return `SC-${year}${month}${day}-${seq}`;
}
