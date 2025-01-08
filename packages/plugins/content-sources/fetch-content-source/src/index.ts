import type { IContentSource, Scheduled } from "@aviaryjs/core";
import { Awaitable } from "@aviaryjs/core/utils";

export class FetchContentSource<TScheduled extends Scheduled>
	implements IContentSource<TScheduled, string>
{
	private url: string;
	private getRequestParams: (scheduled: TScheduled) => RequestInit;
	private transformResponse: (res: Response) => Awaitable<string>;

	constructor({
		url,
		getRequestParams = () => ({}),
		transformResponse = (res) => res.text(),
	}: {
		url: FetchContentSource<TScheduled>["url"];
		getRequestParams: FetchContentSource<TScheduled>["getRequestParams"];
		transformResponse: FetchContentSource<TScheduled>["transformResponse"];
	}) {
		this.url = url;
		this.getRequestParams = getRequestParams;
		this.transformResponse = transformResponse;
	}

	async getContent(scheduled: TScheduled) {
		const response = await fetch(
			this.url,
			this.getRequestParams(scheduled)
		);
		const content = await this.transformResponse(response);
		return content;
	}
}
