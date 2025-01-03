import { Aviary } from "@aviaryjs/core";
import { AsyncQueue } from "@aviaryjs/core/utils";
import { serve } from "bun";

const port = 3001;

const ctx = {
	queue: new AsyncQueue<string>(),
	resolvers: {} as Record<string, (content: string) => void>,
};

const aviary = Aviary.builder()
	.addScheduler({
		async *run() {
			for await (const request of ctx.queue) {
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
		async notify(scheduled, content) {
			ctx.resolvers[scheduled]?.(content);
		},
	})
	.build();
aviary.logger = { log: () => {} };

let i = 0;
serve({
	fetch: async (req: Request) => {
		const _data = await req.text();
		const resolvers = Promise.withResolvers<string>();
		const id = (i++).toString();
		ctx.resolvers[id] = resolvers.resolve;
		ctx.queue.push(id);
		const result = await resolvers.promise;
		return new Response(result);
	},
	port,
	idleTimeout: 1,
});
await aviary.run();
