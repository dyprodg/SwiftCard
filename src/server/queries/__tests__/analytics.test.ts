import { describe, it, expect } from "vitest";
import { getGranularity } from "../analytics";
import type {
  DateRange,
  Granularity,
  TimeSeriesPoint,
  SalesKPIs,
  TopProduct,
  CategoryRevenue,
  RefundTimeSeriesPoint,
  RefundReason,
  RefundKPIs,
  DiscountPerformance,
  CustomerBreakdown,
  TopCustomer,
} from "../analytics";

describe("getGranularity", () => {
  it("returns 'day' for ranges ≤ 60 days", () => {
    expect(getGranularity("2024-01-01", "2024-01-07")).toBe("day");
    expect(getGranularity("2024-01-01", "2024-01-31")).toBe("day");
    expect(getGranularity("2024-01-01", "2024-03-01")).toBe("day");
  });

  it("returns 'week' for ranges 61–365 days", () => {
    expect(getGranularity("2024-01-01", "2024-06-01")).toBe("week");
    expect(getGranularity("2024-01-01", "2024-12-01")).toBe("week");
  });

  it("returns 'month' for ranges > 365 days", () => {
    expect(getGranularity("2023-01-01", "2025-01-02")).toBe("month");
    expect(getGranularity("2022-01-01", "2024-12-31")).toBe("month");
  });

  it("handles same-day range", () => {
    expect(getGranularity("2024-06-15", "2024-06-15")).toBe("day");
  });

  it("handles exactly 60 days", () => {
    expect(getGranularity("2024-01-01", "2024-03-01")).toBe("day");
  });

  it("handles exactly 365 days", () => {
    // 2024 is a leap year, so Jan 1 to Dec 31 = 366 days
    expect(getGranularity("2024-01-01", "2024-12-31")).toBe("week");
  });

  it("handles exactly 366 days (> 365)", () => {
    expect(getGranularity("2024-01-01", "2025-01-01")).toBe("month");
  });
});

describe("analytics types", () => {
  it("DateRange has correct shape", () => {
    const range: DateRange = { dateFrom: "2024-01-01", dateTo: "2024-12-31" };
    expect(range.dateFrom).toBe("2024-01-01");
    expect(range.dateTo).toBe("2024-12-31");
  });

  it("Granularity accepts valid values", () => {
    const values: Granularity[] = ["day", "week", "month"];
    expect(values).toHaveLength(3);
  });

  it("TimeSeriesPoint has correct shape", () => {
    const point: TimeSeriesPoint = {
      date: "2024-01-01",
      revenue: 10000,
      orderCount: 5,
      avgOrderValue: 2000,
    };
    expect(point.revenue).toBe(10000);
  });

  it("SalesKPIs has current and previous values", () => {
    const kpis: SalesKPIs = {
      revenue: 50000,
      orderCount: 10,
      avgOrderValue: 5000,
      refundRate: 5.5,
      previousRevenue: 40000,
      previousOrderCount: 8,
      previousAvgOrderValue: 5000,
      previousRefundRate: 3.2,
    };
    expect(kpis.revenue).toBeGreaterThan(kpis.previousRevenue);
  });

  it("TopProduct has correct shape", () => {
    const product: TopProduct = {
      productId: "abc",
      productName: "Test Product",
      unitsSold: 100,
      revenue: 500000,
    };
    expect(product.unitsSold).toBe(100);
  });

  it("CategoryRevenue allows null categoryId", () => {
    const cat: CategoryRevenue = {
      categoryId: null,
      categoryName: "Uncategorized",
      revenue: 10000,
    };
    expect(cat.categoryId).toBeNull();
  });

  it("RefundTimeSeriesPoint has correct shape", () => {
    const point: RefundTimeSeriesPoint = {
      date: "2024-01-01",
      amount: 5000,
      count: 2,
    };
    expect(point.count).toBe(2);
  });

  it("RefundReason has correct shape", () => {
    const reason: RefundReason = {
      reason: "DAMAGED",
      count: 3,
      amount: 15000,
    };
    expect(reason.reason).toBe("DAMAGED");
  });

  it("RefundKPIs has correct shape", () => {
    const kpis: RefundKPIs = {
      totalRefunded: 25000,
      refundCount: 5,
      refundRate: 10,
    };
    expect(kpis.refundRate).toBe(10);
  });

  it("DiscountPerformance has correct shape", () => {
    const disc: DiscountPerformance = {
      discountId: "disc1",
      code: "SAVE20",
      name: "Summer Sale",
      type: "PERCENTAGE",
      timesUsed: 50,
      totalGiven: 100000,
      revenueGenerated: 500000,
    };
    expect(disc.code).toBe("SAVE20");
  });

  it("DiscountPerformance allows null code", () => {
    const disc: DiscountPerformance = {
      discountId: "disc2",
      code: null,
      name: "Auto Discount",
      type: "FIXED",
      timesUsed: 10,
      totalGiven: 50000,
      revenueGenerated: 200000,
    };
    expect(disc.code).toBeNull();
  });

  it("CustomerBreakdown has correct shape", () => {
    const breakdown: CustomerBreakdown = {
      newCustomers: 30,
      returningCustomers: 20,
    };
    expect(breakdown.newCustomers + breakdown.returningCustomers).toBe(50);
  });

  it("TopCustomer has correct shape", () => {
    const customer: TopCustomer = {
      customerEmail: "test@example.com",
      orderCount: 5,
      totalSpent: 250000,
    };
    expect(customer.customerEmail).toBe("test@example.com");
  });
});
