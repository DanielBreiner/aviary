import type { IContentSource, Scheduled } from "@aviaryjs/core";

export class SimpleContentSource<TScheduled extends Scheduled>
	implements IContentSource<TScheduled, string>
{
	async getContent(scheduled: TScheduled) {
		return `Hello, ${scheduled.toString()}`;
	}
}
