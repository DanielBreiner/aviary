import { Aviary } from "@aviaryjs/core";
import { PeriodicScheduler } from "../src/index.js";

await Aviary.builder()
	.addScheduler(
		new PeriodicScheduler("0/5 * * * * *", async () => {
			const result = await fetch("https://www.jsonfeed.org/feed.json");
			const json = (await result.json()) as {
				items: { title: string }[];
			};
			return json.items.map((item) => ({
				data: item.title,
				date: new Date(),
			}));
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
