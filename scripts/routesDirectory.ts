import {DuploConfig, DuploInstance, PromiseOrNot} from "@duplojs/duplojs";
import {existsSync, lstatSync, mkdirSync, readdirSync} from "fs";
import {relative, resolve} from "path";
import ignore from "ignore";
import packageJson from "../package.json";

declare module "@duplojs/duplojs" {
	interface Plugins {
		"@duplojs/routes-directory": {version: string},
	}
}

type DuploRoutesDirectoryMatchs = {
	pattern: RegExp,
	handler: (instance: DuploInstance<DuploConfig>, options: DuploRoutesDirectoryOptions, path: string) => PromiseOrNot<any>,
	ignores?: string[],
};

interface DuploRoutesDirectoryOptions {
    path?: string;
    matchs?: DuploRoutesDirectoryMatchs[];
	ignores?: string[];
}

function duploRoutesDirectory(instance: DuploInstance<DuploConfig>, options?: DuploRoutesDirectoryOptions){
	instance.plugins["@duplojs/routes-directory"] = {version: packageJson.version};

	if(!options) options = {};
	options.path = resolve(options.path || "./routes");
	options.matchs = options.matchs || [];
	const ig = ignore().add(options.ignores || []);
    
	if(!existsSync(options.path)) mkdirSync(options.path, {recursive: true});
    
	const files: PromiseOrNot<any>[] = [];
	
	(function pathFinding(path, arr: PromiseOrNot<any>[]){
		for(const file of readdirSync(path)){
			const fullPath = resolve(path, file);
			if(ig.ignores(relative(options.path as string, fullPath))) continue;

			if(lstatSync(fullPath).isDirectory()) pathFinding(fullPath, arr);

			const match = options.matchs?.find(match => match.pattern.test(file));
			if(match){
				const subIg = ignore().add(match.ignores || []);
				if(subIg.ignores(relative(options.path as string, fullPath))) continue;
				arr.push(match.handler(instance, options, fullPath));
			}
		}
	})(options.path, files);

	return Promise.all(files);
}

export default duploRoutesDirectory;

function matchScriptFile(importer: (path: string) => Promise<any>){
	matchScriptFile.importer = importer;
	return matchScriptFile;
}
matchScriptFile.importer = (path: string) => import(path);
matchScriptFile.pattern = /\.[jt]sx?$/;
matchScriptFile.ignore = ["_**", "test.**"];
matchScriptFile.handler = async(
	instance: DuploInstance<DuploConfig>, 
	options: DuploRoutesDirectoryOptions, 
	path: string
) => {
	const imported = await matchScriptFile.importer(path);
	if(!imported.default || typeof imported.default !== "function") return;
	imported.default(path.replace(options.path as string, "").replace(matchScriptFile.pattern, ""));
};

function matchHtmlOrCSSFile(importer: (path: string) => Promise<any>){
	matchHtmlOrCSSFile.importer = importer;
	return matchHtmlOrCSSFile;
}
matchHtmlOrCSSFile.importer = (path: string) => import(path);
matchHtmlOrCSSFile.pattern = /\.(html|css)$/;
matchHtmlOrCSSFile.ignore = ["_**", "test.**"];
matchHtmlOrCSSFile.handler = async(
	instance: DuploInstance<DuploConfig>, 
	options: DuploRoutesDirectoryOptions, 
	path: string
) => {
	instance
	.declareRoute("GET", path.replace(options.path as string, ""))
	.handler(({}, response) => response.code(200).sendFile(path));
};

export {
	matchScriptFile,
	matchHtmlOrCSSFile,
};
