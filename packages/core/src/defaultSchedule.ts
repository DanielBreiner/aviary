import { ISchedule, Logger, Scheduled } from "./index.js";
import { abortableSleep } from "./utils.js";

export namespace DefaultSchedule {
	export type Requested<TScheduled extends Scheduled> = {
		data: TScheduled;
		date: Date;
	};
}

/**
 * A default implementation of ISchedule.
 *
 * Requests are scheduled by date and yielded when their date is reached.
 *
 * Schedulers must provide DefaultSchedule.Requested<TScheduled> objects
 *
 * @see DefaultSchedule.Requested.
 */
export class DefaultSchedule<TScheduled extends Scheduled>
	implements ISchedule<DefaultSchedule.Requested<TScheduled>, TScheduled>
{
	private scheduled: DefaultSchedule.Requested<TScheduled>[] = [];
	private sleepController = new AbortController();
	logger: Logger = console;

	add(scheduled: DefaultSchedule.Requested<TScheduled>) {
		this.logger.log("[schedule] Adding scheduled", scheduled);
		this.scheduled.push(scheduled);
		const oldController = this.sleepController;
		this.sleepController = new AbortController();
		oldController.abort();
	}

	async *run() {
		while (true) {
			const next = this.scheduled.shift();
			if (next === undefined) {
				this.logger.log("[schedule] Waiting for new scheduled");
				await abortableSleep({
					signal: this.sleepController.signal,
				});
				continue;
			} else {
				this.logger.log("[schedule] Waiting for", next.date);
				await abortableSleep({
					ms: next.date.getTime() - Date.now(),
					signal: this.sleepController.signal,
				});
				const accepted: boolean = yield next.data;
				if (!accepted) {
					this.logger.log(
						"[schedule] Data were not accepted: ",
						next.data
					);
				}
			}
		}
	}
}
