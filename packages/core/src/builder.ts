import {
	Requested,
	Scheduled,
	Content,
	IScheduler,
	ISchedule,
	IContentSource,
	INotifier,
	Aviary,
} from "./index.js";
import { DefaultSchedule } from "./defaultSchedule.js";
import { NonEmptyArray } from "./utils.js";

export class EmptyBuilder {
	addScheduler<TScheduled extends Scheduled>(
		scheduler: IScheduler<DefaultSchedule.Requested<TScheduled>>
	): IDefaultSchedulerBuilder<TScheduled>;
	addScheduler<TRequested extends Requested>(
		scheduler: IScheduler<TRequested>
	): ISchedulerBuilder<TRequested>;
	addScheduler<TRequested extends Requested>(
		scheduler: IScheduler<TRequested>
	) {
		return new SchedulerBuilder<TRequested>([scheduler]);
	}
}

export interface ISchedulerBuilder<TRequested extends Requested> {
	addScheduler<TNewRequested extends Requested>(
		scheduler: IScheduler<TNewRequested>
	): ISchedulerBuilder<TRequested | TNewRequested>;
	addSchedule<
		TScheduled extends TRequested extends DefaultSchedule.Requested<
			infer DefaultRequested
		>
			? DefaultRequested
			: Requested
	>(
		schedule: ISchedule<TRequested, TScheduled>
	): ScheduleBuilder<TRequested, TScheduled>;
}
export type IDefaultSchedulerBuilder<TScheduled extends Scheduled> = Omit<
	ISchedulerBuilder<DefaultSchedule.Requested<TScheduled>>,
	"addScheduler"
> & {
	addScheduler<TNewScheduled extends Scheduled>(
		scheduler: IScheduler<DefaultSchedule.Requested<TNewScheduled>>
	): IDefaultSchedulerBuilder<TScheduled | TNewScheduled>;
	addScheduler<TRequested extends Requested>(
		scheduler: IScheduler<TRequested>
	): ISchedulerBuilder<TRequested | DefaultSchedule.Requested<TScheduled>>;
	addSchedule(
		schedule: ISchedule<DefaultSchedule.Requested<TScheduled>, TScheduled>
	): ScheduleBuilder<DefaultSchedule.Requested<TScheduled>, TScheduled>;
	addContentSource<TContent extends Content>(
		contentSource: IContentSource<TScheduled, TContent>
	): ContentSourceBuilder<
		DefaultSchedule.Requested<TScheduled>,
		TScheduled,
		TContent
	>;
};

class SchedulerBuilder<TRequested extends Requested>
	implements ISchedulerBuilder<TRequested>
{
	private schedulers: NonEmptyArray<IScheduler<TRequested>>;

	constructor(schedulers: NonEmptyArray<IScheduler<TRequested>>) {
		this.schedulers = schedulers;
	}

	addScheduler<TNewRequested extends Requested>(
		scheduler: IScheduler<TNewRequested>
	) {
		const schedulers: NonEmptyArray<
			IScheduler<TRequested | TNewRequested>
		> = [...this.schedulers, scheduler];
		return new SchedulerBuilder(schedulers);
	}

	addSchedule<
		TScheduled extends TRequested extends DefaultSchedule.Requested<
			infer TDefaultScheduledUser
		>
			? TDefaultScheduledUser
			: Scheduled
	>(schedule: ISchedule<TRequested, TScheduled>) {
		return new ScheduleBuilder<TRequested, TScheduled>(
			this.schedulers,
			schedule
		);
	}

	addContentSource<TContent extends Content>(
		contentSource: IContentSource<
			DefaultSchedule.Requested<TRequested>,
			TContent
		>
	) {
		return new ContentSourceBuilder(
			// @ts-expect-error
			this.schedulers,
			new DefaultSchedule<DefaultSchedule.Requested<TRequested>>(),
			[contentSource]
		);
	}
}

export class ScheduleBuilder<
	TRequested extends Requested,
	TScheduled extends Scheduled
> {
	private schedulers: NonEmptyArray<IScheduler<TRequested>>;
	private schedule: ISchedule<TRequested, TScheduled>;

	constructor(
		schedulers: NonEmptyArray<IScheduler<TRequested>>,
		schedule: ISchedule<TRequested, TScheduled>
	) {
		this.schedulers = schedulers;
		this.schedule = schedule;
	}

	addContentSource<TContent extends Content>(
		contentSource: IContentSource<TScheduled, TContent>
	) {
		return new ContentSourceBuilder(this.schedulers, this.schedule, [
			contentSource,
		]);
	}
}

export class ContentSourceBuilder<
	TRequested extends Requested,
	TScheduled extends Scheduled,
	TContent extends Content
> {
	private schedulers: NonEmptyArray<IScheduler<TRequested>>;
	private schedule: ISchedule<TRequested, TScheduled>;
	private contentSources: NonEmptyArray<IContentSource<TScheduled, TContent>>;

	constructor(
		schedulers: NonEmptyArray<IScheduler<TRequested>>,
		schedule: ISchedule<TRequested, TScheduled>,
		contentSources: NonEmptyArray<IContentSource<TScheduled, TContent>>
	) {
		this.schedulers = schedulers;
		this.schedule = schedule;
		this.contentSources = contentSources;
	}

	addContentSource<TNewContent extends Content>(
		contentSource: IContentSource<TScheduled, TNewContent>
	) {
		const contentSources: NonEmptyArray<
			IContentSource<TScheduled, TContent | TNewContent>
		> = [...this.contentSources, contentSource];
		return new ContentSourceBuilder(
			this.schedulers,
			this.schedule,
			contentSources
		);
	}

	addNotifier(notifier: INotifier<TScheduled, TContent>) {
		return new NotifierBuilder(
			this.schedulers,
			this.schedule,
			this.contentSources,
			notifier
		);
	}
}

class NotifierBuilder<
	TRequested extends Requested,
	TScheduled extends Scheduled,
	TContent extends Content
> {
	private schedulers: NonEmptyArray<IScheduler<TRequested>>;
	private schedule: ISchedule<TRequested, TScheduled>;
	private contentSources: NonEmptyArray<IContentSource<TScheduled, TContent>>;
	private notifiers: NonEmptyArray<INotifier<TScheduled, TContent>>;

	constructor(
		schedulers: NonEmptyArray<IScheduler<TRequested>>,
		schedule: ISchedule<TRequested, TScheduled>,
		contentSources: NonEmptyArray<IContentSource<TScheduled, TContent>>,
		notifier: INotifier<TScheduled, TContent>
	) {
		this.schedulers = schedulers;
		this.schedule = schedule;
		this.contentSources = contentSources;
		this.notifiers = [notifier];
	}

	addNotifier(notifier: INotifier<TScheduled, TContent>) {
		this.notifiers.push(notifier);
		return this;
	}

	build() {
		return new Aviary({
			schedulers: this.schedulers,
			schedule: this.schedule,
			contentSources: this.contentSources,
			notifiers: this.notifiers,
		});
	}

	async run() {
		return await this.build().run();
	}
}
