import { describe, it, expect } from "vitest";
import {
  createReturnSchema,
  approveReturnSchema,
  rejectReturnSchema,
  receiveReturnSchema,
  refundReturnSchema,
} from "./return";

describe("createReturnSchema", () => {
  const validInput = {
    orderId: "order_123",
    reason: "DEFECTIVE" as const,
    items: [{ orderItemId: "item_1", quantity: 1 }],
  };

  it("accepts valid input", () => {
    expect(createReturnSchema.parse(validInput)).toEqual(validInput);
  });

  it("accepts valid input with note", () => {
    const input = { ...validInput, note: "Item arrived broken" };
    expect(createReturnSchema.parse(input)).toEqual(input);
  });

  it("accepts valid input with per-item reason", () => {
    const input = {
      ...validInput,
      items: [{ orderItemId: "item_1", quantity: 2, reason: "WRONG_ITEM" as const }],
    };
    expect(createReturnSchema.parse(input)).toEqual(input);
  });

  it("rejects empty orderId", () => {
    expect(() => createReturnSchema.parse({ ...validInput, orderId: "" })).toThrow();
  });

  it("rejects invalid reason", () => {
    expect(() =>
      createReturnSchema.parse({ ...validInput, reason: "INVALID" }),
    ).toThrow();
  });

  it("rejects empty items array", () => {
    expect(() => createReturnSchema.parse({ ...validInput, items: [] })).toThrow();
  });

  it("rejects zero quantity", () => {
    expect(() =>
      createReturnSchema.parse({
        ...validInput,
        items: [{ orderItemId: "item_1", quantity: 0 }],
      }),
    ).toThrow();
  });

  it("rejects negative quantity", () => {
    expect(() =>
      createReturnSchema.parse({
        ...validInput,
        items: [{ orderItemId: "item_1", quantity: -1 }],
      }),
    ).toThrow();
  });

  it("rejects note over 1000 characters", () => {
    expect(() =>
      createReturnSchema.parse({ ...validInput, note: "a".repeat(1001) }),
    ).toThrow();
  });

  it("accepts all valid reason values", () => {
    const reasons = [
      "DEFECTIVE",
      "WRONG_ITEM",
      "NOT_AS_DESCRIBED",
      "CHANGED_MIND",
      "TOO_LARGE",
      "TOO_SMALL",
      "OTHER",
    ] as const;
    for (const reason of reasons) {
      expect(() => createReturnSchema.parse({ ...validInput, reason })).not.toThrow();
    }
  });

  it("accepts multiple items", () => {
    const input = {
      ...validInput,
      items: [
        { orderItemId: "item_1", quantity: 1 },
        { orderItemId: "item_2", quantity: 3 },
      ],
    };
    expect(createReturnSchema.parse(input)).toEqual(input);
  });
});

describe("approveReturnSchema", () => {
  it("accepts valid input", () => {
    expect(approveReturnSchema.parse({ returnId: "ret_1" })).toEqual({
      returnId: "ret_1",
    });
  });

  it("accepts with adminNote", () => {
    expect(
      approveReturnSchema.parse({ returnId: "ret_1", adminNote: "Approved" }),
    ).toEqual({ returnId: "ret_1", adminNote: "Approved" });
  });

  it("rejects empty returnId", () => {
    expect(() => approveReturnSchema.parse({ returnId: "" })).toThrow();
  });
});

describe("rejectReturnSchema", () => {
  it("accepts valid input with reason", () => {
    expect(
      rejectReturnSchema.parse({ returnId: "ret_1", adminNote: "Past return window" }),
    ).toEqual({ returnId: "ret_1", adminNote: "Past return window" });
  });

  it("rejects empty adminNote", () => {
    expect(() =>
      rejectReturnSchema.parse({ returnId: "ret_1", adminNote: "" }),
    ).toThrow();
  });

  it("rejects missing adminNote", () => {
    expect(() => rejectReturnSchema.parse({ returnId: "ret_1" })).toThrow();
  });

  it("rejects adminNote over 1000 characters", () => {
    expect(() =>
      rejectReturnSchema.parse({ returnId: "ret_1", adminNote: "a".repeat(1001) }),
    ).toThrow();
  });
});

describe("receiveReturnSchema", () => {
  it("accepts valid input", () => {
    expect(receiveReturnSchema.parse({ returnId: "ret_1" })).toEqual({
      returnId: "ret_1",
    });
  });

  it("accepts with adminNote", () => {
    expect(
      receiveReturnSchema.parse({ returnId: "ret_1", adminNote: "Items look good" }),
    ).toEqual({ returnId: "ret_1", adminNote: "Items look good" });
  });
});

describe("refundReturnSchema", () => {
  it("accepts valid input", () => {
    expect(refundReturnSchema.parse({ returnId: "ret_1", restoreStock: true })).toEqual({
      returnId: "ret_1",
      restoreStock: true,
    });
  });

  it("accepts with restoreStock false", () => {
    expect(refundReturnSchema.parse({ returnId: "ret_1", restoreStock: false })).toEqual({
      returnId: "ret_1",
      restoreStock: false,
    });
  });

  it("accepts with adminNote", () => {
    expect(
      refundReturnSchema.parse({
        returnId: "ret_1",
        restoreStock: true,
        adminNote: "Refunded per policy",
      }),
    ).toEqual({
      returnId: "ret_1",
      restoreStock: true,
      adminNote: "Refunded per policy",
    });
  });

  it("rejects missing restoreStock", () => {
    expect(() => refundReturnSchema.parse({ returnId: "ret_1" })).toThrow();
  });
});
