import { Hono } from "hono";
import type { AuraRuntime } from "@aura/core";

export function createManifestRouter(runtime: AuraRuntime): Hono {
  const router = new Hono();

  router.get("/", (c) => {
    const manifest = {
      operations: runtime.operations.list()
        .filter((op) => op.access !== "internal")
        .map((op) => ({
          name: op.name,
          type: op.type,
          access: op.access,
          entities: [...op.entities],
        })),
    };
    return c.json(manifest);
  });

  return router;
}
