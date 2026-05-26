import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

import "./operations/_registry";

const handler = createStartHandler(defaultStreamHandler);

export default { fetch: handler };
