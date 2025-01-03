import { Aviary } from "@aviaryjs/core";
import { VanillaCronScheduler } from "../src/index.js";

await Aviary.builder()
	.addScheduler(new VanillaCronScheduler("* * * * * *", ["user1", "user2"]))
	.addScheduler(new VanillaCronScheduler("0/5 * * * * *", ["user9"]))
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
