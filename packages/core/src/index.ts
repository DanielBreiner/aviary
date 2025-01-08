import { EmptyBuilder } from "./builder.js";
import { DefaultSchedule } from "./defaultSchedule.js";
import { Awaitable, AwaitableGenerator, NonEmptyArray } from "./utils.js";

type NonNullishAny = {};

export type Requested = NonNullishAny;
export type Scheduled = NonNullishAny;
export type Content = NonNullishAny;

export type Logger<TScheduled extends Scheduled = any> = {
	log: (...args: any[]) => void;
	reportScheduled?: (scheduled: TScheduled) => void;
	reportNotifyStart?: (scheduled: TScheduled) => void;
	reportNotifyEnd?: (content: TScheduled) => void;
};

/**
 * Extracts the requested type from a scheduler or schedule.
 */
export type RequestedOf<T extends IScheduler<any> | ISchedule<any, any>> =
	T extends IScheduler<infer TRequested>
		? TRequested
		: T extends ISchedule<infer TRequested, any>
		? TRequested
		: never;

/**
 * Extracts the scheduled type from a scheduler, schedule, notifier, or content source.
 */
export type ScheduledOf<
	T extends
		| IScheduler<DefaultSchedule.Requested<any>>
		| ISchedule<any, any>
		| INotifier<any, any>
		| IContentSource<any, any>
> = T extends IScheduler<DefaultSchedule.Requested<infer TScheduled>>
	? TScheduled
	: T extends ISchedule<any, infer TScheduled>
	? TScheduled
	: T extends INotifier<infer TScheduled, any>
	? TScheduled
	: T extends IContentSource<infer TScheduled, any>
	? TScheduled
	: never;

/**
 * Extracts the content type from a content source or notifier.
 */
export type ContentOf<
	T extends IContentSource<any, any> | INotifier<any, any>
> = T extends IContentSource<any, infer TContent>
	? TContent
	: T extends INotifier<any, infer TContent>
	? TContent
	: never;

export interface IScheduler<TRequested extends Requested> {
	run: () => AwaitableGenerator<TRequested>;
}

export interface ISchedule<
	TRequested extends Requested,
	TScheduled extends Scheduled
> {
	add: (requested: TRequested) => void;
	run: () => AwaitableGenerator<TScheduled, void, boolean>;
	logger?: Logger;
}

export interface IContentSource<
	TScheduled extends Scheduled,
	TContent extends Content
> {
	getContent: (scheduled: TScheduled) => Awaitable<TContent>;
	accepts?: (scheduled: TScheduled) => boolean;
}

export interface INotifier<
	TScheduled extends Scheduled,
	TContent extends Content
> {
	notify: (scheduled: TScheduled, content: TContent) => Awaitable<void>;
	accepts?: (scheduled: TScheduled, content: TContent) => boolean;
}

/**
 * Instances of Aviary perform the main coordination logic
 */
export class Aviary<
	TRequested extends Requested,
	TScheduled extends Scheduled,
	TContent extends Content
> {
	private schedulers: NonEmptyArray<IScheduler<TRequested>>;
	private schedule: ISchedule<TRequested, TScheduled>;
	private contentSources: NonEmptyArray<IContentSource<TScheduled, TContent>>;
	private notifiers: NonEmptyArray<INotifier<TScheduled, TContent>>;

	private _logger: Logger = console;

	/**
	 * Entry point for creating an Aviary instance
	 */
	static builder() {
		return new EmptyBuilder();
	}

	constructor({
		schedulers,
		schedule,
		contentSources,
		notifiers,
	}: {
		schedulers: NonEmptyArray<IScheduler<TRequested>>;
		schedule: ISchedule<TRequested, TScheduled>;
		contentSources: NonEmptyArray<IContentSource<TScheduled, TContent>>;
		notifiers: NonEmptyArray<INotifier<TScheduled, TContent>>;
	}) {
		this.schedulers = schedulers;
		this.schedule = schedule;
		this.contentSources = contentSources;
		this.notifiers = notifiers;
	}

	/**
	 * Starts the main coordination logic
	 */
	async run() {
		this.logger.log("Starting Aviary");

		const schedulerJob = async (scheduler: IScheduler<TRequested>) => {
			const schedulerGenerator = scheduler.run();
			for await (const requested of schedulerGenerator) {
				this.schedule.add(requested);
			}
			this.logger.log("scheduler ended");
		};

		const scheduleJob = async (
			schedule: ISchedule<TRequested, TScheduled>
		) => {
			const processScheduled = async (scheduled: TScheduled) => {
				this.logger.reportScheduled?.(scheduled);
				const contentSource = this.contentSources.find(
					(cs) => cs.accepts?.(scheduled) ?? true
				);
				if (contentSource === undefined) return false;
				const content = await contentSource.getContent(scheduled);
				const notifier = this.notifiers.find(
					(n) => n.accepts?.(scheduled, content) ?? true
				);
				if (notifier === undefined) return false;
				this.logger.reportNotifyStart?.(scheduled);
				await notifier.notify(scheduled, content);
				this.logger.reportNotifyEnd?.(scheduled);
				return true;
			};

			const scheduleGenerator = schedule.run();
			let scheduleIterator = await scheduleGenerator.next();
			while (!scheduleIterator.done) {
				const scheduled = scheduleIterator.value;
				const success = await processScheduled(scheduled);
				scheduleIterator = await scheduleGenerator.next(success);
			}
			this.logger.log("schedule ended");
		};

		await Promise.all([
			...this.schedulers.map(schedulerJob),
			scheduleJob(this.schedule),
		]);
	}

	/**
	 * Runs the Aviary instance in parallel using workers. See documentation for limitations.
	 */
	async runWorkers() {
		this.logger.log("Starting Aviary in parallel (using workers)");

		const schedulerJob = (scheduler: IScheduler<TRequested>) => {
			const file = new File(
				[
					`
				const scheduler = {
					${scheduler.run.toString()},
				};
				// this.logger.log("scheduler start");
				const schedulerGenerator = scheduler.run();
				for await (const requested of schedulerGenerator) {
					postMessage(requested);
				}
				// this.logger.log("scheduler ended");
				`,
				],
				"worker.js"
			);
			const worker = new Worker(URL.createObjectURL(file));
			worker.addEventListener("message", (event) => {
				const scheduled = event.data;
				this.schedule.add(scheduled);
			});
		};

		const scheduleJob = async (
			schedule: ISchedule<TRequested, TScheduled>
		) => {
			const processScheduled = async (scheduled: TScheduled) => {
				const contentSource = this.contentSources.find(
					(cs) => cs.accepts?.(scheduled) ?? true
				);
				if (contentSource === undefined) return false;
				const content = await contentSource.getContent(scheduled);
				const notifier = this.notifiers.find(
					(n) => n.accepts?.(scheduled, content) ?? true
				);
				if (notifier === undefined) return false;
				await notifier.notify(scheduled, content);
				return true;
			};

			const scheduleGenerator = schedule.run();
			let scheduleIterator = await scheduleGenerator.next();
			while (!scheduleIterator.done) {
				const scheduled = scheduleIterator.value;
				const success = await processScheduled(scheduled);
				scheduleIterator = await scheduleGenerator.next(success);
			}
			this.logger.log("schedule ended");
		};

		this.schedulers.map(schedulerJob);
		await scheduleJob(this.schedule);
	}

	get logger() {
		return this._logger;
	}

	set logger(logger: Logger) {
		this._logger = logger;
		this.schedule.logger = logger;
	}
}
