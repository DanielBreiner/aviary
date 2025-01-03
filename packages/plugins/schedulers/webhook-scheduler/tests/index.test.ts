import { Aviary } from "@aviaryjs/core";
import { WebhookScheduler } from "../src/index.js";
import { z } from "zod";

// type test
Aviary.builder()
	.addScheduler(
		new WebhookScheduler({
			validator: z.object({
				name: z.string(),
			}),
		})
	)
	// @ts-expect-error
	.addContentSource({
		getContent() {
			return "string";
		},
	});

await Aviary.builder()
	.addScheduler(
		new WebhookScheduler({
			validator: z.object({
				data: z.string(),
				date: z.coerce.date(),
			}),
		})
	)
	.addContentSource({
		getContent(data) {
			console.log(`[content-source] Getting content for ${data}`);
			return `Content for ${data}`;
		},
	})
	.addNotifier({
		notify(data, content) {
			console.log(`[notifier] Notifying ${data} with ${content}`);
		},
	})
	.run();

new WebhookScheduler({
	validator: z.object({
		name: z.string(),
		email: z.string().email(),
		birthCertNum: z.string().regex(/^\d{8}\/\d{4}$/),
		gender: z.enum(["male", "female", "other"]),
	}),
});
