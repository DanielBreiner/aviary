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
					<!doctype html>
					<html>
						<head>
							<meta http-equiv="refresh" content="1" />
						</head>
						<body>
							<h1>Notification service</h1>
							<p>Target of a notifier plugin, channel ${channel}</p>
							<p>Last reload: ${new Date("2025-12-28 15:34:11").toLocaleString()}</p>
							<h2>Messages</h2>
							${
								this.messages.length > 0
									? this.messages
											.map(
												(message) => `<p>${message}</p>`
											)
											.join("")
									: "<p>No messages</p>"
							}
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
		this.messages.push(
			`Message for scheduled "${data.name}": "${content}"`
		);
		console.log(`Notifier: ${data.name} - ${content}`);
	}

	accepts(data: RequestedOf<typeof scheduler>["data"]) {
		return data.channel === this.channel;
	}
}
