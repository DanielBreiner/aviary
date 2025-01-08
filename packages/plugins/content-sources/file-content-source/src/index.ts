import type { IContentSource, Scheduled } from "@aviaryjs/core";
import { readFileSync } from "node:fs";

export class FileContentSource<TScheduled extends Scheduled>
	implements IContentSource<TScheduled, string>
{
	private fileContent: string;

	constructor(path: string) {
		this.fileContent = readFileSync(path, "utf-8");
	}

	async getContent(_scheduled: TScheduled) {
		return this.fileContent;
	}
}
