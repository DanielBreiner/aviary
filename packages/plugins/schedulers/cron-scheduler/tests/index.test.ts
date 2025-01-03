import { Aviary } from "@aviaryjs/core";
import { CronScheduler } from "../src/index.js";

await Aviary.builder()
	.addScheduler(new CronScheduler("* * * * * *", ["user1", "user2"]))
	.addScheduler(new CronScheduler("0/5 * * * * *", ["user9"]))
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

// TODO tests for changing the cron time
