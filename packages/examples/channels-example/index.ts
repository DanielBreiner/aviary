import { Aviary } from "@aviaryjs/core";
import { scheduler } from "./scheduler.js";
import { WebNotifier } from "./notifier.js";

const app = Aviary.builder()
	.addScheduler(scheduler)
	.addContentSource({
		getContent(data) {
			return `Content for ${data.name} on channel ${data.channel}`;
		},
	})
	.addNotifier(new WebNotifier({ port: 3010, channel: "1" }))
	.addNotifier(new WebNotifier({ port: 3011, channel: "2" }))
	.build();

const page = await Bun.file("app.html").text();

const server = Bun.serve({
	port: 3123,
	async fetch(_req) {
		return new Response(page, {
			headers: { "Content-Type": "text/html" },
		});
	},
});

console.log(`Example app started on ${server.url}`);

await app.run();
