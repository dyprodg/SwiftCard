const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function buildOrderViewUrl(orderId: string, token: string, locale: string = "en") {
  return `${APP_URL}/${locale}/order/${orderId}?token=${token}`;
}
