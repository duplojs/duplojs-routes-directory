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

declare global {
	var CURRENT_PATH: string;
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
	
	return (async function pathFinding(path){
		for(const file of readdirSync(path)){
			const fullPath = resolve(path, file);
			if(ig.ignores(relative(options.path as string, fullPath))) continue;

			if(lstatSync(fullPath).isDirectory()) await pathFinding(fullPath);

			const match = options.matchs?.find(match => match.pattern.test(file));
			if(match){
				const subIg = ignore().add(match.ignores || []);
				if(subIg.ignores(relative(options.path as string, fullPath))) continue;
				global.CURRENT_PATH = fullPath;
				await match.handler(instance, options, fullPath);
				global.CURRENT_PATH = "";
			}
		}
	})(options.path);
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
	const urlPath = path
	.replace(options.path as string, "")
	.replace(matchScriptFile.pattern, "")
	.replace(/\.[^/\\]*$/, "");
	
	CURRENT_PATH = urlPath;

	const imported = await matchScriptFile.importer(path);
	if(typeof imported.default === "function") imported.default(urlPath);
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
