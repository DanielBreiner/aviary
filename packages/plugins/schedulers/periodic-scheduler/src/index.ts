import type { IScheduler, Requested } from "@aviaryjs/core";
import { CronJob, CronTime } from "cron";
import { AsyncQueue } from "@aviaryjs/core/utils";

export class PeriodicScheduler<TRequested extends Requested>
	implements IScheduler<TRequested>
{
	private job: CronJob;
	private queue = new AsyncQueue<TRequested>();
	private callback: () => Promise<TRequested | TRequested[]>;

	private onCronTick = async () => {
		const scheduled = await this.callback();
		if (Array.isArray(scheduled)) {
			for (const s of scheduled) {
				this.queue.push(s);
			}
		} else {
			this.queue.push(scheduled);
		}
	};

	constructor(
		cron: string,
		callback: () => Promise<TRequested | TRequested[]>
	) {
		this.job = new CronJob(cron, this.onCronTick);
		this.callback = callback;
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
