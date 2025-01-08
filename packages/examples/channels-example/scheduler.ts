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

const page = await Bun.file("scheduler.html").text();

const server = Bun.serve({
	port: 3002,
	async fetch(_req) {
		return new Response(page, {
			headers: { "Content-Type": "text/html" },
		});
	},
});

console.log(`Scheduler frontend started on ${server.url}`);
