import { z } from "zod";
import { WebhookScheduler } from "../../plugins/schedulers/webhook-scheduler/src/index.js";

// Scheduler webhook

export const scheduler = new WebhookScheduler({
	validator: z.object({
		data: z.object({ name: z.string(), channel: z.string() }),
		date: z.coerce.date(),
	}),
	port: 3000,
});

// Scheduler frontend

const server = Bun.serve({
	port: 3002,
	static: {
		"/": new Response(await Bun.file("scheduler.html").bytes(), {
			headers: { "Content-Type": "text/html" },
		}),
	},
	fetch(_req) {
		return new Response("Not found", { status: 404 });
	},
});

console.log(`Scheduler frontend started on ${server.url}`);
