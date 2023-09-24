# duplojs-routes-directory

## Instalation
```
npm i @duplojs/routes-directory
```

## Utilisation
```ts
import Duplo from "@duplojs/duplojs";
import duploRoutesDirectory, {matchScriptFile} from "@duplojs/routes-directory";

const duplo = Duplo({port: 1506, host: "0.0.0.0"});

duplo.use(
    duploRoutesDirectory, 
    {
        path: "./routes",
        matchs: [matchScriptFile]
    }
).then(() => duplo.launch());
```