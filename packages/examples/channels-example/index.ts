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

const server = Bun.serve({
	port: 3123,
	static: {
		"/": new Response(await Bun.file("app.html").bytes(), {
			headers: { "Content-Type": "text/html" },
		}),
	},
	fetch(_req) {
		return new Response("Not found", { status: 404 });
	},
});

console.log(`Example app started on ${server.url}`);

await app.run();
