import {methods} from "@duplojs/duplojs";
import {parentPort} from "worker_threads";

/* PATH : / */
export default (path: string) => parentPort?.postMessage(path);
/* METHOD : GET, PATH : / */
export const GET = (method: methods, path: string) => parentPort?.postMessage(`${method}:${path}`);
