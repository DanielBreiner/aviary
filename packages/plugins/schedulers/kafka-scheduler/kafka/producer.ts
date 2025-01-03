import { Kafka } from "kafkajs";

const kafka = new Kafka({
	clientId: "my-app",
	brokers: ["localhost:9093"],
});

const producer = kafka.producer();

const run = async () => {
	await producer.connect();
	await producer.send({
		topic: "test-topic",
		messages: [{ value: "Hello World!" }],
	});
	await producer.disconnect();
};

run().catch(console.error);
