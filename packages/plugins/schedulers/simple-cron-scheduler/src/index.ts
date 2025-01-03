import type { IScheduler, Scheduled } from "@aviaryjs/core";
import type { DefaultSchedule } from "@aviaryjs/core/defaultSchedule";
import { CronJob } from "cron";
import { AsyncQueue } from "@aviaryjs/core/utils";

export class SimpleCronScheduler<TScheduled extends Scheduled>
	implements IScheduler<DefaultSchedule.Requested<TScheduled>>
{
	constructor(private cron: string, private users: TScheduled[]) {}

	async *run() {
		const queue = new AsyncQueue<DefaultSchedule.Requested<TScheduled>>();

		new CronJob(this.cron, () => {
			for (const data of this.users) {
				queue.push({
					data,
					date: new Date(),
				});
			}
		}).start();

		for await (const request of queue) {
			yield request;
		}
	}
}
