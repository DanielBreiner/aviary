import { Aviary } from "@aviaryjs/core";
import { PeriodicScheduler } from "../../plugins/schedulers/periodic-scheduler/dist/index.js";
import { AnalyticsModule } from "@aviaryjs/core/analytics";

enum Group {
	A = "A",
	B = "B",
}

const allUsers = ["user1", "user2", "user3", "user4", "user5", "user6"];

function getUsersInGroup(group: Group) {
	return allUsers.filter(
		(_user, index) => index % 2 === (group === Group.A ? 0 : 1)
	);
}

const mock = {
	interactionChance(group: Group) {
		const baseChance = group === Group.A ? 0.5 : 0.7;
		const randomChance = Math.random() * 0.2 - 0.1;
		return baseChance + randomChance;
	},
	timeToInteraction(group: Group) {
		const baseTime = group === Group.A ? 1000 : 2000;
		const randomTime = Math.random() * 1000;
		return baseTime + randomTime;
	},
};

function createVariant(group: Group) {
	const analytics = new AnalyticsModule<string>();
	const aviary = Aviary.builder()
		.addScheduler(
			new PeriodicScheduler("*/5 * * * * *", () =>
				getUsersInGroup(Group.A).map((user) => ({
					date: new Date(),
					data: user,
				}))
			)
		)
		.addContentSource({
			getContent() {
				return "Content";
			},
		})
		.addNotifier({
			notify(user) {
				setTimeout(() => {
					if (Math.random() < mock.interactionChance(group)) {
						analytics.reportInteraction(user);
					}
				}, mock.timeToInteraction(group));
			},
		})
		.build();
	analytics.connect(aviary);
	return { group, aviary, analytics };
}

const variants = Object.values(Group).map(createVariant);

function printStatus() {
	console.log(`Analytics at ${new Date().toLocaleString()}:`);

	variants.forEach(({ group, analytics }) => {
		console.log(`Group ${group}`);
		console.log(JSON.stringify(analytics.getSummary()));
	});
}

variants.forEach(({ aviary }) => aviary.run());
setInterval(printStatus, 5000);
