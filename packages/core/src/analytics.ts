import { Aviary, Scheduled } from "./index.js";

type AnalyticsData = {
	scheduledAt?: Date;
	notifyStart?: Date;
	notifyEnd?: Date;
	interactedAt?: Date;
};

/**
 * Module for tracking analytics about scheduled entities, their times of notification and interaction
 *
 * Requires TScheduled to be comparable
 */
export class AnalyticsModule<TScheduled extends Scheduled> {
	private data: { scheduled: TScheduled; data: AnalyticsData }[] = [];

	private addMetric(scheduled: TScheduled, metric: keyof AnalyticsData) {
		const existing = this.data.findLast((d) => d.scheduled === scheduled);
		if (existing && existing.data[metric] === undefined) {
			existing.data[metric] = new Date();
		} else {
			this.data.push({
				scheduled,
				data: {
					[metric]: new Date(),
				},
			});
		}
	}

	reportInteraction(scheduled: TScheduled) {
		this.addMetric(scheduled, "interactedAt");
	}

	/**
	 * Connects the analytics module to an Aviary instance
	 */
	connect(aviary: Aviary<any, TScheduled, any>) {
		aviary.logger = {
			log: console.log,
			reportScheduled: (scheduled) => {
				this.addMetric(scheduled, "scheduledAt");
			},
			reportNotifyStart: (scheduled) => {
				this.addMetric(scheduled, "notifyStart");
			},
			reportNotifyEnd: (scheduled) => {
				this.addMetric(scheduled, "notifyEnd");
			},
		};
	}

	/**
	 * Returns raw collected data
	 */
	getData() {
		return this.data;
	}
	/**
	 * Compiles a simple summary of the collected data
	 */
	getSummary() {
		const notificationCount = this.data.filter(
			(d) =>
				d.data.notifyStart !== undefined ||
				d.data.notifyEnd !== undefined
		).length;
		const interactionCount = this.data.filter(
			(d) => d.data.interactedAt !== undefined
		).length;

		const totalNotificationDuration = this.data.reduce((acc, d) => {
			if (d.data.notifyStart && d.data.notifyEnd) {
				return (
					acc +
					(d.data.notifyEnd.getTime() - d.data.notifyStart.getTime())
				);
			}
			return acc;
		}, 0);
		const averageNotificationDuration = (
			totalNotificationDuration /
			notificationCount /
			1000
		).toFixed(2);

		const totalInteractionTime = this.data.reduce((acc, d) => {
			if (d.data.notifyEnd && d.data.interactedAt) {
				return (
					acc +
					(d.data.interactedAt.getTime() - d.data.notifyEnd.getTime())
				);
			}
			return acc;
		}, 0);

		const averageInteractionTime = (
			totalInteractionTime /
			interactionCount /
			1000
		).toFixed(2);

		const percentInteracted = (
			notificationCount ? (interactionCount / notificationCount) * 100 : 0
		).toFixed(0);

		return {
			averageNotificationDuration,
			averageInteractionTime,
			percentInteracted,
		};
	}
}
