// Set env vars before any module loads (order-url.ts reads NEXT_PUBLIC_APP_URL at module scope)
process.env.NEXT_PUBLIC_APP_URL = "https://test.swiftcart.ch";
