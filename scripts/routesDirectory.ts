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
    path?: string | string[];
    matchs?: DuploRoutesDirectoryMatchs[];
	ignores?: string[];
}

function duploRoutesDirectory(instance: DuploInstance<DuploConfig>, options?: DuploRoutesDirectoryOptions){
	instance.plugins["@duplojs/routes-directory"] = {version: packageJson.version};

	if(!options){
		options = {};
	}
	if(!options.path){
		throw new Error("@duplojs/routes-directory: options need 'path' property.");
	}
	if(typeof options.path === "string"){
		options.path = [options.path];
	}
	options.path = options.path.map((p) => resolve(p));
	options.matchs = options.matchs || [];
	const ig = ignore().add(options.ignores || []);
    
	const matchs: Promise<void>[] = [];
	
	for(const path of options.path){
		if(!existsSync(path)) mkdirSync(path, {recursive: true});

		(function pathFinding(currentPath){
			for(const file of readdirSync(currentPath)){
				const fullPath = resolve(currentPath, file);
				if(ig.ignores(relative(path as string, fullPath))){ 
					continue;
				}

				if(lstatSync(fullPath).isDirectory()) pathFinding(fullPath);

				const match = options.matchs?.find(match => match.pattern.test(file));
				if(match){
					const subIg = ignore().add(match.ignores || []);
					if(subIg.ignores(relative(path as string, fullPath))){
						continue;
					}
					matchs.push(
						match.handler(
							instance, 
							{path, matchs: options.matchs, ignores: options.ignores}, 
							fullPath
						)
					);
				}
			}
		})(path);
	}

	return Promise.all(matchs);
}

export default duploRoutesDirectory;

const methods = [
	"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"
];

function matchScriptFile(importer: (path: string) => Promise<any>){
	matchScriptFile.importer = importer;
	return matchScriptFile;
}
matchScriptFile.importer = (path: string) => import(path);
matchScriptFile.pattern = /\.[jt]sx?$/;
matchScriptFile.ignore = [] as string[];
matchScriptFile.handler = async(
	instance: DuploInstance<DuploConfig>, 
	options: DuploRoutesDirectoryOptions, 
	path: string
) => {
	const urlPath = path
	.replace(options.path as string, "")
	.replace(/\\/g, "/")
	.replace(matchScriptFile.pattern, "")
	.replace(/\.[^/\\]*$/, "")
	.replace(/\/index$/, "") || "/";

	const imported = await matchScriptFile.importer(path);
	if(typeof imported.default === "function"){
		let content = await readFile(path, "utf-8");
		const comment = `/* PATH : ${urlPath} */`;
		if(!content.includes(comment)){
			content = content.replace(
				/\n?[ \t]*export default/g, 
				`\n${comment}\nexport default`
			);
			await writeFile(path, content, "utf-8");
		}
		imported.default(urlPath);
	}

	if(methods.find(method => typeof imported[method] === "function")){
		let content = await readFile(path, "utf-8");
		for(const method of methods){
			if(typeof imported[method] === "function"){
				const comment = `/* METHOD : ${method}, PATH : ${urlPath} */`;
				if(!content.includes(comment)){
					content = content.replace(
						new RegExp(`\\n?[ \\t]*export (:?const|let|var) ${method}`), 
						`\n${comment}\nexport const ${method}`
					);
					await writeFile(path, content, "utf-8");
				}
				imported[method](method, urlPath);
			}
		}
		
	}
};


function matchHtmlOrCSSFile(importer: (path: string) => Promise<any>){
	matchHtmlOrCSSFile.importer = importer;
	return matchHtmlOrCSSFile;
}
matchHtmlOrCSSFile.importer = (path: string) => import(path);
matchHtmlOrCSSFile.pattern = /\.(html|css)$/;
matchHtmlOrCSSFile.ignore = [] as string[];
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
