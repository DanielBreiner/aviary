FROM oven/bun
WORKDIR /app
COPY ../../.. .
RUN bun install
WORKDIR /packages/examples/channels-example
CMD ["bun", "start"]
EXPOSE 3000