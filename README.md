# duplojs-routes-directory
[![NPM version](https://img.shields.io/npm/v/@duplojs/routes-directory)](https://www.npmjs.com/package/@duplojs/routes-directory)

## Instalation
```
npm i @duplojs/routes-directory
```

## Utilisation
```ts
import Duplo from "@duplojs/duplojs";
import duploRoutesDirectory, {matchScriptFile} from "@duplojs/routes-directory";

const duplo = Duplo({port: 1506, host: "localhost", environment: "DEV"});

duplo.use(
    duploRoutesDirectory, 
    {
        path: "./routes",
        matchs: [matchScriptFile]
    }
).then(() => duplo.launch());
```