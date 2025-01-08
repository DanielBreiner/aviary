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
	private port?: number;
	private hostname?: string;

	constructor(options: {
		validator: Validator<TOutput>;
		port?: number;
		hostname?: string;
	}) {
		this.validationFn = getValidationFn(options.validator);
		this.port = options.port;
		this.hostname = options.hostname;
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
		server.listen(this.port, this.hostname);

		console.log(
			`Webhook server running at ${JSON.stringify(server.address())}`
		);

		for await (const request of queue) {
			yield request;
		}
	}
}
