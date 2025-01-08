## Kafka scheduler example integration

Start the Kafka broker:

`docker compose up`

Start Aviary:

`bun index.ts`

Send a message to the Kafka topic:

`bun producer.ts`
