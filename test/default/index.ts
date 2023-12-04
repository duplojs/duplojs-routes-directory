import {zod} from "@duplojs/duplojs";
import {workerTesting} from "@duplojs/worker-testing";
import {readFileSync} from "fs";

export default workerTesting(
	__dirname + "/route.ts",
	[
		{
			title: "get html file",
			url: "http://localhost:1506/user.html",
			method: "GET",
			response: {
				code: 200,
				body: zod.literal(readFileSync(__dirname + "/../routes/user.html", "utf-8"))
			}
		}
	],
	[
		"/user/{id}",
		"/user/{id}",
		"/user",
		"/user",
		"/user",
	]
);
