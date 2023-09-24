import {DuploConfig, DuploInstance, PromiseOrNot} from "@duplojs/duplojs";
import {existsSync, lstatSync, mkdirSync, readdirSync} from "fs";
import {relative, resolve} from "path";
import ignore from "ignore";

type DuploRoutesDirectoryMatchs = {
	pattern: RegExp,
	handler: (instance: DuploInstance<DuploConfig>, options: DuploRoutesDirectoryOptions, path: string) => PromiseOrNot<void>,
	ignores?: string[],
};

interface DuploRoutesDirectoryOptions {
    path?: string;
    matchs?: DuploRoutesDirectoryMatchs[];
	ignores?: string[];
}

function duploRoutesDirectory(instance: DuploInstance<DuploConfig>, options?: DuploRoutesDirectoryOptions){
	if(!options) options = {};
	options.path = resolve(options.path || "./routes");
	options.matchs = options.matchs || [];
	const ig = ignore().add(options.ignores || []);
    
	if(!existsSync(options.path)) mkdirSync(options.path, {recursive: true});
    
	return (async function pathFinding(path){
		for(const file of readdirSync(path)){
			const fullPath = resolve(path, file);
			if(ig.ignores(relative(options.path as string, fullPath))) continue;

			if(lstatSync(fullPath).isDirectory()) await pathFinding(fullPath);

			const match = options.matchs?.find(match => match.pattern.test(file));
			if(match){
				const subIg = ignore().add(match.ignores || []);
				if(subIg.ignores(relative(options.path as string, fullPath))) continue;
				await match.handler(instance, options, fullPath);
			}
		}
	})(options.path);
}

export default duploRoutesDirectory;

export const matchScriptFile: DuploRoutesDirectoryMatchs = {
	pattern: /\.[jt]sx?$/,
	async handler(instance, options, path){
		const imported = await import(path);
		if(!imported.default || typeof imported.default !== "function") return;
		imported.default(path.replace(options.path as string, "").replace(this.pattern, ""));
	},
	ignores: ["_**", "test.**"]
};

export const matchHtmlOrCSSFile: DuploRoutesDirectoryMatchs = {
	pattern: /\.(:?html|css)$/i,
	async handler(instance, options, path){
		instance
		.declareRoute("GET", path.replace(options.path as string, ""))
		.handler(({}, response) => response.code(200).sendFile(path));
	},
	ignores: ["_**", "test.**"]
};
