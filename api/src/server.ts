import { createApp } from "./app.js";
import { buildDeps } from "./wire.js";

const { deps, port } = buildDeps();
createApp(deps).listen(port, () => console.log(`VerDrift API on :${port}`));
