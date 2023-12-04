import {parentPort} from "worker_threads";
import "../../default/route";

parentPort?.postMessage(CURRENT_PATH);

export default (path: string) => parentPort?.postMessage(path);
