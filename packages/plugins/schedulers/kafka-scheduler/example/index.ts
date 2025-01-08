import { Aviary } from "@aviaryjs/core";
import { KafkaScheduler } from "../src/index.js";

await Aviary.builder()
	.addScheduler(
		new KafkaScheduler({
			brokers: ["localhost:9093"],
			groupId: "test-group",
			topic: "test-topic",
			consumerRunConfig: {
				autoCommitInterval: 100,
			},
			transformPayload: ({ message }) => {
				if (!message.value) {
					return null;
				}
				return {
					data: message.value.toString(),
					date: new Date(),
				};
			},
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
