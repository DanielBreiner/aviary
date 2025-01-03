import { Aviary } from "@aviaryjs/core";
import { AsyncQueue } from "@aviaryjs/core/utils";
import { run, bench } from "mitata";

for (let i = 0; i < 18; i++) {
	const ctx = {
		resolve: undefined as undefined | ((data: any) => void),
		queue: new AsyncQueue(),
	};

	const aviary = Aviary.builder()
		.addScheduler({
			async *run() {
				for await (const task of ctx.queue) {
					yield {
						date: new Date(),
						data: task,
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
			notify(data) {
				ctx.resolve?.(data);
			},
		})
		.build();
	aviary.logger = { log: () => {} };

	const size = 2 ** i;
	for (let j = 0; j < size; j++) {
		ctx.queue.push(j);
	}
	let left = size;

	const resolvers = Promise.withResolvers();
	ctx.resolve = () => {
		left--;
		if (left === 0) {
			resolvers.resolve();
		}
	};

	bench(`load of ${size}`, async () => {
		aviary.run();
		await resolvers.promise;
	});
}

await run();
