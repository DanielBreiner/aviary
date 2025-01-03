import type { IScheduler, Scheduled } from "@aviaryjs/core";
import type { DefaultSchedule } from "@aviaryjs/core/defaultSchedule";
import { CronJob, CronTime } from "cron";
import { AsyncQueue } from "@aviaryjs/core/utils";

export class CronScheduler<TScheduled extends Scheduled>
	implements IScheduler<DefaultSchedule.Requested<TScheduled>>
{
	private job: CronJob;
	private queue = new AsyncQueue<DefaultSchedule.Requested<TScheduled>>();
	public users: TScheduled[];

	private onCronTick = () => {
		for (const data of this.users) {
			this.queue.push({
				data,
				date: new Date(),
			});
		}
	};

	constructor(cron: string, users: TScheduled[]) {
		this.job = new CronJob(cron, this.onCronTick);
		this.users = users;
	}

	async *run() {
		this.job.start();

		for await (const request of this.queue) {
			yield request;
		}
	}

	getCronString = () => {
		return this.job.cronTime.source;
	};

	setCronString = (cron: string) => {
		this.job.setTime(new CronTime(cron));
	};
}
