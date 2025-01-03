export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
export type Awaitable<T> = T | Promise<T>;
export type AwaitableGenerator<T = unknown, TReturn = any, TNext = unknown> =
	| AsyncGenerator<T, TReturn, TNext>
	| Generator<T, TReturn, TNext>;
export type NonEmptyArray<T> = [T, ...T[]];
export type Never<TMessage extends string> = 0 extends TMessage
	? never
	: TMessage;

const maxSleep = 2147483647;
export function abortableSleep({
	ms = maxSleep,
	signal,
}: {
	ms?: number;
	signal: AbortSignal;
}) {
	return new Promise<void>((resolve) => {
		const handle = setTimeout(resolve, ms);
		signal.addEventListener("abort", () => {
			clearTimeout(handle);
			resolve();
		});
	});
}

/**
 * @example for await (const item of queue) ...
 */
export class AsyncQueue<T> {
	private buffer: T[] = [];
	private resolver: ((value: IteratorResult<T, any>) => void) | null = null;

	push(value: T) {
		if (this.resolver) {
			this.resolver({ value });
			this.resolver = null;
		}
		return this.buffer.push(value);
	}

	get length() {
		return this.buffer.length;
	}

	async *[Symbol.asyncIterator]() {
		while (true) {
			if (this.buffer.length > 0) {
				yield this.buffer.shift()!;
			} else {
				await new Promise((resolve) => {
					this.resolver = resolve;
				});
			}
		}
	}
}
