import {parentPort} from "worker_threads";

export default (path: string) => parentPort?.postMessage(path);
