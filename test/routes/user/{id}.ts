import {parentPort} from "worker_threads";

/* PATH : /user/{id} */
export default (path: string) => parentPort?.postMessage(path);
