# workers-gone-nats-js

Queues and Workers implementation done with NATS and Node.js

## Datadog Vector

> A lightweight, ultra-fast tool for building observability pipelines

[Vector](https://vector.dev/) is a tool for building observability pipelines. It is a single, static binary with no
external dependencies that runs on Linux, macOS, Windows, and Docker. Vector can collect, transform, and route logs,
metrics, and traces.

## Simulating infrastructure with Docker

```bash
docker compose up -d
```

Once docker is up and running, you can access the NATS server at `localhost:4222` and the NATS Streaming server
at `localhost:4223`. Now you can start the workers and the Vector.

## Usage

```bash
npm start
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
