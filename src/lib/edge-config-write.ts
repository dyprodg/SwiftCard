import "server-only";

type EdgeConfigItem = {
  operation: "upsert";
  key: string;
  value: unknown;
};

export async function updateEdgeConfig(items: { key: string; value: unknown }[]) {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const token = process.env.VERCEL_API_TOKEN;

  if (!edgeConfigId || !token) {
    console.warn("Edge Config write skipped: EDGE_CONFIG_ID or VERCEL_API_TOKEN not set");
    return;
  }

  const body: { items: EdgeConfigItem[] } = {
    items: items.map((i) => ({
      operation: "upsert" as const,
      key: i.key,
      value: i.value,
    })),
  };

  const res = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Edge Config update failed:", res.status, text);
    throw new Error(`Edge Config update failed: ${res.status}`);
  }
}
