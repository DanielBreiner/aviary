import { Aviary } from "@aviaryjs/core";
import { AsyncQueue } from "@aviaryjs/core/utils";
import { serve } from "bun";
import { run, bench } from "mitata";

const notifierPort = 3001;
const schedulerPort = 3002;
let left = 0;
let resolve = () => {};
serve({
	fetch: async (req: Request) => {
		const data = await req.text();
		left--;
		if (left === 0) {
			resolve();
		}
		return new Response("OK");
	},
	port: notifierPort,
});
const aviary = Aviary.builder()
	.addScheduler({
		async *run() {
			const queue = new AsyncQueue<string>();
			serve({
				fetch: async (req: Request) => {
					const data = await req.text();
					queue.push(data);
					return new Response("OK");
				},
				port: schedulerPort,
			});
			for await (const request of queue) {
				yield {
					date: new Date(),
					data: request,
				};
			}
		},
	})
	.addContentSource({
		getContent(data) {
			return data;
		},
	})
	.addNotifier({
		async notify(data) {
			await fetch(`localhost:${notifierPort}`, {
				method: "POST",
				body: data,
			});
		},
	})
	.build();
aviary.logger = { log: () => {} };
aviary.run();

// for (let i = 0; i < 10; i++) {
// 	const size = 2 ** i;
const size = 1;
const testResolvers = Promise.withResolvers();
left = size;
resolve = testResolvers.resolve;

bench(`load of ${size}`, async () => {
	for (let j = 0; j < size; j++) {
		await fetch(`localhost:${schedulerPort}`, {
			method: "POST",
			body: j.toString(),
		});
	}
	await testResolvers.promise;
});

await run();
