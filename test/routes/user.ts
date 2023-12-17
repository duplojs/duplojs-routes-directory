import {parentPort} from "worker_threads";
import "../default/route";

/* PATH : /user */
export default (path: string) => parentPort?.postMessage(path);
