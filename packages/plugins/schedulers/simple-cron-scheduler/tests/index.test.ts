import { Aviary } from "@aviaryjs/core";
import { SimpleCronScheduler } from "../src/index.js";

await Aviary.builder()
	.addScheduler(new SimpleCronScheduler("* * * * * *", ["user1", "user2"]))
	.addScheduler(new SimpleCronScheduler("0/5 * * * * *", ["user9"]))
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
