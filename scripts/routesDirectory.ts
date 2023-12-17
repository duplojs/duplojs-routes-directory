import {DuploConfig, DuploInstance, PromiseOrNot} from "@duplojs/duplojs";
import {existsSync, lstatSync, mkdirSync, readdirSync} from "fs";
import {relative, resolve} from "path";
import ignore from "ignore";
import packageJson from "../package.json";
import {readFile, writeFile} from "fs/promises";

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
	const matchs: Promise<void>[] = [];

	(function pathFinding(path){
		for(const file of readdirSync(path)){
			const fullPath = resolve(path, file);
			if(ig.ignores(relative(options.path as string, fullPath))) continue;

			if(lstatSync(fullPath).isDirectory()) pathFinding(fullPath);

			const match = options.matchs?.find(match => match.pattern.test(file));
			if(match){
				const subIg = ignore().add(match.ignores || []);
				if(subIg.ignores(relative(options.path as string, fullPath))) continue;
				matchs.push(match.handler(instance, options, fullPath));
			}
		}
	})(options.path);

	return Promise.all(matchs);
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

	const imported = await matchScriptFile.importer(path);
	if(typeof imported.default === "function"){
		const content = (await readFile(path, "utf-8")).split("\n");
		const index = content.findIndex(value => value.trim().startsWith("export default"));
		if(index !== -1 && !content[index - 1].includes(`/* PATH : ${urlPath} */`)){
			content.splice(index, 0, `/* PATH : ${urlPath} */`);
			await writeFile(path, content.join("\n"), "utf-8");
		}
		imported.default(urlPath);
	}
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
