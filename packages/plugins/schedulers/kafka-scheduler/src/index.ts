import type { IScheduler, Requested } from "@aviaryjs/core";
import { AsyncQueue } from "@aviaryjs/core/utils";
import {
	Consumer,
	ConsumerConfig,
	ConsumerRunConfig,
	EachMessagePayload,
	Kafka,
	KafkaConfig,
} from "kafkajs";

type KafkaSchedulerConfig<TRequested extends Requested> = {
	brokers: KafkaConfig["brokers"];
	kafkaConfig?: Omit<KafkaConfig, "brokers">;
	groupId: ConsumerConfig["groupId"];
	consumerConfig?: Omit<ConsumerConfig, "groupId">;
	consumerRunConfig?: Omit<ConsumerRunConfig, "eachBatch" | "eachMessage">;
	topic: string | RegExp;
	transformPayload: (message: EachMessagePayload) => TRequested | null;
};

export class KafkaScheduler<TRequested extends Requested>
	implements IScheduler<TRequested>
{
	consumer: Consumer;
	queue = new AsyncQueue<TRequested>();
	consumerRunConfig: KafkaSchedulerConfig<TRequested>["consumerRunConfig"];
	topic: KafkaSchedulerConfig<TRequested>["topic"];
	transformPayload: KafkaSchedulerConfig<TRequested>["transformPayload"];

	constructor({
		brokers,
		kafkaConfig,
		consumerConfig,
		groupId,
		consumerRunConfig,
		topic,
		transformPayload,
	}: KafkaSchedulerConfig<TRequested>) {
		const kafka = new Kafka({ brokers, ...kafkaConfig });
		this.consumer = kafka.consumer({ groupId, ...consumerConfig });
		this.consumerRunConfig = consumerRunConfig;
		this.topic = topic;
		this.transformPayload = transformPayload;
	}

	async *run() {
		await this.consumer.connect();

		await this.consumer.subscribe({
			topic: this.topic,
			fromBeginning: true,
		});

		void this.consumer.run({
			eachMessage: async (payload) => {
				const transformed = this.transformPayload(payload);
				if (transformed) {
					this.queue.push(transformed);
				}
			},
			...this.consumerRunConfig,
		});

		for await (const request of this.queue) {
			yield request;
		}
	}
}
