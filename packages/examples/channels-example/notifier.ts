import { INotifier, RequestedOf } from "@aviaryjs/core";
import { scheduler } from "./scheduler.js";

export class WebNotifier
	implements INotifier<RequestedOf<typeof scheduler>["data"], string>
{
	private channel: string;
	private messages: string[];

	constructor({ port, channel }: { port: number; channel: string }) {
		this.channel = channel;
		this.messages = [];

		const server = Bun.serve({
			port,
			fetch: async (_req) => {
				const content = `
					<html>
						<head>
							<meta http-equiv="refresh" content="3" />
						</head>
						<body>
							<h1>Notifier target, channel ${channel}</h1>
							<p>Last reload: ${new Date()}</p>
							<h2>Messages</h2>
							${this.messages.map((message) => `<p>${message}</p>`).join("")}
						</body>
					</html>
				`;
				return new Response(content, {
					headers: { "Content-Type": "text/html" },
				});
			},
		});

		console.log(`Notifier target server started on ${server.url}`);
	}

	notify(data: RequestedOf<typeof scheduler>["data"], content: string) {
		this.messages.push(`Message for data "${data.name}": "${content}"`);
		console.log(`Notifier: ${data.name} - ${content}`);
	}

	accepts(data: RequestedOf<typeof scheduler>["data"]) {
		return data.channel === this.channel;
	}
}
