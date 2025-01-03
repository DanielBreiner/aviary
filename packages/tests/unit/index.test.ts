import { Aviary } from "@aviaryjs/core";
import { abortableSleep, AsyncQueue } from "@aviaryjs/core/utils";
import { sleep } from "bun";
import { expect, test } from "bun:test";
import { randomBytes } from "crypto";

test(
	"workers",
	async () => {
		Aviary.builder()
			.addScheduler({
				async *run() {
					const sleep = require("bun").sleep;
					const users = ["user1", "user2"];
					for (const data of users) {
						yield {
							data,
							date: new Date(Date.now() + 1000), // In 1 seconds
						};
					}
					await sleep(2000);
					for (const data of users) {
						yield {
							data,
							date: new Date(Date.now() + 1000), // In 1 seconds
						};
					}
				},
			})
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
			.build()
			.runWorkers();

		await sleep(6000);
	},
	{ timeout: 10000 }
);

test("multiple notifiers", async () => {
	Aviary.builder()
		.addScheduler({
			async *run() {
				yield {
					data: "string",
					date: new Date(),
				};
			},
		})
		.addContentSource({
			getContent() {
				return "string";
			},
		})
		.addNotifier({
			notify() {},
		})
		.addNotifier({
			notify() {},
		})
		.run();
	await sleep(1000);
});

test("async queue", async () => {
	const queue = new AsyncQueue<string>();

	let start = Date.now();

	const expected: [string, number][] = [];

	function addToQueue(duration: number) {
		const item: [string, number] = [randomBytes(10).toString(), duration];
		expected.push(item);
		setTimeout(() => {
			queue.push(item[0]);
		}, duration);
	}

	// in order
	addToQueue(100);
	addToQueue(200);
	addToQueue(300);
	addToQueue(400);

	async function runQueue() {
		for await (const item of queue) {
			const expectedItem = expected.shift();
			expect(expectedItem).toBeDefined();
			expect(item).toEqual(expectedItem![0]);
			const duration = Date.now() - start;
			const expectedDuration = expectedItem![1];
			expect(duration - expectedDuration).toBeLessThan(100);
		}
	}

	await Promise.race([runQueue(), sleep(3000)]);

	expect(queue.length).toBe(0);
	expect(expected.length).toBe(0);
});

test("abortable sleep", async () => {
	{
		const controller = new AbortController();

		const start = Date.now();
		const expected = 100;

		setTimeout(() => {
			controller.abort();
		}, expected);

		await abortableSleep({ signal: controller.signal });

		const duration = Date.now() - start;
		expect(duration - expected).toBeLessThan(100);
	}
	{
		const controller = new AbortController();

		const start = Date.now();
		const expected = 200;

		setTimeout(() => {
			controller.abort();
		}, expected * 10);

		await abortableSleep({ ms: expected, signal: controller.signal });

		const duration = Date.now() - start;
		expect(duration - expected).toBeLessThan(100);
	}
});
