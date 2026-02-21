import { describe, it, expect } from "vitest";
import { ROUTES } from "./routes";

describe("ROUTES", () => {
  it("has static storefront routes", () => {
    expect(ROUTES.home).toBe("/");
    expect(ROUTES.products).toBe("/products");
    expect(ROUTES.cart).toBe("/cart");
    expect(ROUTES.checkout).toBe("/checkout");
    expect(ROUTES.checkoutSuccess).toBe("/checkout/success");
  });

  it("has dynamic product route", () => {
    expect(ROUTES.product("classic-tee")).toBe("/products/classic-tee");
  });

  it("has account routes", () => {
    expect(ROUTES.account.orders).toBe("/account/orders");
    expect(ROUTES.account.settings).toBe("/account/settings");
    expect(ROUTES.account.data).toBe("/account/data");
  });

  it("has admin routes", () => {
    expect(ROUTES.admin.dashboard).toBe("/admin/dashboard");
    expect(ROUTES.admin.products).toBe("/admin/products");
    expect(ROUTES.admin.productNew).toBe("/admin/products/new");
    expect(ROUTES.admin.orders).toBe("/admin/orders");
    expect(ROUTES.admin.customers).toBe("/admin/customers");
  });

  it("has dynamic admin routes", () => {
    expect(ROUTES.admin.productEdit("prod-1")).toBe("/admin/products/prod-1/edit");
    expect(ROUTES.admin.orderDetail("ord-1")).toBe("/admin/orders/ord-1");
  });

  it("has admin settings routes", () => {
    expect(ROUTES.admin.settings.general).toBe("/admin/settings/general");
    expect(ROUTES.admin.settings.shipping).toBe("/admin/settings/shipping");
    expect(ROUTES.admin.settings.payment).toBe("/admin/settings/payment");
    expect(ROUTES.admin.settings.legal).toBe("/admin/settings/legal");
  });

  it("has legal routes", () => {
    expect(ROUTES.privacy).toBe("/privacy");
    expect(ROUTES.terms).toBe("/terms");
    expect(ROUTES.imprint).toBe("/imprint");
  });
});
