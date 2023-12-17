import {parentPort} from "worker_threads";
import "../../default/route";

/* PATH : /user/{id} */
export default (path: string) => parentPort?.postMessage(path);
