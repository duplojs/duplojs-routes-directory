import Duplo from "@duplojs/duplojs";
import duploRoutesDirectory, {matchHtmlOrCSSFile, matchScriptFile} from "../../scripts/routesDirectory";
import {parentPort} from "worker_threads";

const duplo = Duplo({port: 1506, host: "0.0.0.0", environment: "DEV"});

duplo.use(duploRoutesDirectory, {
	path: __dirname + "/../routes", 
	matchs: [
		matchHtmlOrCSSFile, 
		matchScriptFile
	]
})
.then(() => duplo.launch(() => parentPort?.postMessage("ready")));
