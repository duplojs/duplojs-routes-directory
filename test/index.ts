import Duplo from "@duplojs/duplojs";
import duploRoutesDirectory, {matchHtmlOrCSSFile, matchScriptFile} from "../scripts/routesDirectory";

const duplo = Duplo({port: 1506, host: "0.0.0.0"});

duplo.use(duploRoutesDirectory, {path: "./test/routes", matchs: [matchScriptFile, matchHtmlOrCSSFile]}).then(() => duplo.launch());
