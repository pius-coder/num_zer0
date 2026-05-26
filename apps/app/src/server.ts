import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

import "./operations/_registry";

const ASSET_EXTENSIONS = new Set([
  ".js", ".mjs", ".css", ".woff2", ".woff", ".ttf", ".otf",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".json", ".txt", ".xml",
]);

const handler = createStartHandler(defaultStreamHandler);

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const ext = url.pathname.split(".").pop();
    if (ext && ASSET_EXTENSIONS.has(`.${ext}`)) {
      const file = Bun.file(`dist/client/${url.pathname.replace(/^\//, "")}`);
      if (await file.exists()) return new Response(file);
    }
    return handler(request);
  },
};
