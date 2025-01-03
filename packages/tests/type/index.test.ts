import { Aviary } from "@aviaryjs/core";

export type Expect<T extends true> = T;
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
	T
>() => T extends Y ? 1 : 2
	? true
	: false;

// Basic usage
Aviary.builder()
	.addScheduler({
		async *run() {
			yield {
				user: "requested",
			};
		},
	})
	.addSchedule({
		add(scheduled) {
			type _cases = [Expect<Equal<typeof scheduled, { user: string }>>];
		},
		async *run() {
			yield "scheduled";
		},
	})
	.addContentSource({
		getContent(data) {
			type _cases = [Expect<Equal<typeof data, string>>];
			return "content";
		},
	})
	.addNotifier({
		notify(data, content) {
			type _cases = [
				Expect<Equal<typeof data, string>>,
				Expect<Equal<typeof content, string>>
			];
		},
	});

// Default schedule
Aviary.builder()
	.addScheduler({
		async *run() {
			yield {
				data: "string",
				date: new Date(),
			};
		},
	})
	.addContentSource({
		getContent(data) {
			type _cases = [Expect<Equal<typeof data, string>>];
			return "string";
		},
	})
	.addNotifier({
		notify(data, content) {
			type _cases = [
				Expect<Equal<typeof data, string>>,
				Expect<Equal<typeof content, string>>
			];
		},
	});

// Missing schedule for non-default IScheduled
Aviary.builder()
	.addScheduler({
		async *run() {
			yield {
				data: "string",
			};
		},
	})
	// @ts-expect-error
	.addContentSource({
		// @ts-expect-error
		getContent(_data) {
			return "string";
		},
	});

// Multiple schedulers union output type
Aviary.builder()
	.addScheduler({
		async *run() {
			yield {
				data: "string",
			};
		},
	})
	.addScheduler({
		async *run() {
			yield "asd";
		},
	})
	.addScheduler({
		async *run() {
			yield 1;
		},
	})
	.addSchedule({
		add(scheduled) {
			type _cases = [
				Expect<
					Equal<typeof scheduled, { data: string } | string | number>
				>
			];
		},
		async *run() {},
	});

// Multiple default schedulers union output type
Aviary.builder()
	.addScheduler({
		async *run() {
			yield {
				data: {
					name: "string",
					age: 1,
				},
				date: new Date(),
			};
		},
	})
	.addScheduler({
		async *run() {
			yield {
				data: "string",
				date: new Date(),
			};
		},
	})
	.addScheduler({
		async *run() {
			yield {
				data: 1,
				date: new Date(),
			};
		},
	})
	.addContentSource({
		getContent(data) {
			type _cases = [
				Expect<
					Equal<
						typeof data,
						{ name: string; age: number } | string | number
					>
				>
			];
			return "string";
		},
	});

// Content source union type
Aviary.builder()
	.addScheduler({
		async *run() {
			yield {
				data: "string",
				date: new Date(),
			};
		},
	})
	.addContentSource({
		getContent(_data) {
			return "string";
		},
	})
	.addContentSource({
		getContent(_data) {
			return 123;
		},
	})
	.addContentSource({
		getContent(_data) {
			return {
				text: "string",
				pages: 10,
			};
		},
	})
	.addNotifier({
		notify(data, content) {
			type _cases = [
				Expect<Equal<typeof data, string>>,
				Expect<
					Equal<
						typeof content,
						| string
						| number
						| {
								text: string;
								pages: number;
						  }
					>
				>
			];
		},
	});

// Non async generators
Aviary.builder()
	.addScheduler({
		*run() {
			yield {
				data: "string",
			};
		},
	})
	.addSchedule({
		add(scheduled) {
			type _cases = [Expect<Equal<typeof scheduled, { data: string }>>];
			return;
		},
		*run() {
			yield "string";
		},
	})
	.addContentSource({
		getContent(data) {
			type _cases = [Expect<Equal<typeof data, string>>];
			return "string";
		},
	})
	.addNotifier({
		notify(data, content) {
			type _cases = [
				Expect<Equal<typeof data, string>>,
				Expect<Equal<typeof content, string>>
			];
		},
	});
