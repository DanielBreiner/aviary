import type { IScheduler, Requested } from "@aviaryjs/core";
import { createServer, ServerResponse } from "node:http";
import { AsyncQueue } from "@aviaryjs/core/utils";
import { ValidationFn, Validator, getValidationFn } from "./validator.js";
import { getErrorMessage } from "./utils.js";

function setCorsHeaders(res: ServerResponse) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export class WebhookScheduler<TOutput extends Requested>
	implements IScheduler<TOutput>
{
	private validationFn: ValidationFn<TOutput>;

	constructor(options: { validator: Validator<TOutput> }) {
		this.validationFn = getValidationFn(options.validator);
	}

	async *run() {
		const queue = new AsyncQueue<TOutput>();

		const server = createServer(async (req, res) => {
			if (req.method === "OPTIONS") {
				setCorsHeaders(res);
				res.end();
			}

			try {
				const body = await new Promise<string>((resolve, reject) => {
					let data = "";
					req.on("data", (chunk) => (data += chunk));
					req.on("end", () => resolve(data));
					req.on("error", (err) => reject(err));
				});
				const data = JSON.parse(body);
				const result = await this.validationFn(data);
				queue.push(result);
				setCorsHeaders(res);
				res.end("OK");
			} catch (error) {
				res.writeHead(400);
				res.end(getErrorMessage(error));
			}
		});
		server.listen();

		console.log(
			`Webhook server running at ${JSON.stringify(server.address())}`
		);

		for await (const request of queue) {
			yield request;
		}
	}
}
