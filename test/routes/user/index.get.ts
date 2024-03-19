import {parentPort} from "worker_threads";

/* PATH : /user */
export default (path: string) => parentPort?.postMessage(path);
