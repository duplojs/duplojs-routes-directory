import {defineConfig} from "rollup";
import esbuild from "rollup-plugin-esbuild";
import json from "@rollup/plugin-json";

export default defineConfig([
	{
		input: "scripts/routesDirectory.ts",
		output: [
			{
				file: "dist/routesDirectory.mjs",
				format: "esm"
			},
			{
				file: "dist/routesDirectory.cjs",
				format: "cjs",
			}
		],
		plugins: [
			esbuild({
				include: /\.[jt]sx?$/,
				exclude: /node_modules/,
				tsconfig: "tsconfig.json",
			}),
			json(),
		]
	},
]);
