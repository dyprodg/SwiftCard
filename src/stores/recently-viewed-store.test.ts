import { describe, it, expect, beforeEach } from "vitest";
import { useRecentlyViewedStore } from "./recently-viewed-store";

describe("recently-viewed-store", () => {
  beforeEach(() => {
    useRecentlyViewedStore.setState({ productIds: [] });
  });

  it("adds a product", () => {
    useRecentlyViewedStore.getState().addProduct("p1");
    expect(useRecentlyViewedStore.getState().productIds).toEqual(["p1"]);
  });

  it("moves duplicate to front", () => {
    const { addProduct } = useRecentlyViewedStore.getState();
    addProduct("p1");
    addProduct("p2");
    addProduct("p1");
    expect(useRecentlyViewedStore.getState().productIds).toEqual(["p1", "p2"]);
  });

  it("limits to 10 items", () => {
    const { addProduct } = useRecentlyViewedStore.getState();
    for (let i = 1; i <= 12; i++) {
      addProduct(`p${i}`);
    }
    const ids = useRecentlyViewedStore.getState().productIds;
    expect(ids).toHaveLength(10);
    expect(ids[0]).toBe("p12");
    expect(ids[9]).toBe("p3");
  });

  it("most recent is first", () => {
    const { addProduct } = useRecentlyViewedStore.getState();
    addProduct("p1");
    addProduct("p2");
    addProduct("p3");
    expect(useRecentlyViewedStore.getState().productIds[0]).toBe("p3");
  });

  it("clears all items", () => {
    const { addProduct, clear } = useRecentlyViewedStore.getState();
    addProduct("p1");
    addProduct("p2");
    clear();
    expect(useRecentlyViewedStore.getState().productIds).toEqual([]);
  });
});
