import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

import "./operations/_registry";

const startFetch = createStartHandler(defaultStreamHandler);

export default { fetch: startFetch };
