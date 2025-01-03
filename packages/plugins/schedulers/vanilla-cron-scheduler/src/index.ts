import type { IScheduler, Scheduled } from "@aviaryjs/core";
import { CronTime } from "cron";
import { DefaultSchedule } from "@aviaryjs/core/defaultSchedule";

export class VanillaCronScheduler<TScheduled extends Scheduled>
	implements IScheduler<DefaultSchedule.Requested<TScheduled>>
{
	constructor(private cron: string, private users: TScheduled[]) {}

	async *run() {
		const cronTime = new CronTime(this.cron);
		let nextDate = cronTime.sendAt().toJSDate();
		while (true) {
			const now = new Date();
			if (nextDate > now) {
				const sleepTime = nextDate.getTime() - now.getTime();
				await sleep(sleepTime);
			}

			for (const data of this.users) {
				yield {
					data,
					date: new Date(),
				};
			}

			nextDate = cronTime.sendAt().toJSDate();
		}
	}
}

function sleep(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}
