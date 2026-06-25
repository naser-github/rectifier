# Running Rectifier

Rectifier is a browser-only static client. Docker is used only to build and
serve the static app files.

The Docker Compose runtime starts one app container only, named
`rectifier_app`. It does not start a backend, database, cache, queue, AI
service, account service, or model sidecar. User JSON must stay in the browser.

## Docker Compose

Validate the Compose file:

```bash
docker compose config
```

Start the app after the Vite client scaffold exists:

```bash
docker compose up --build
```

Open the app at:

```text
http://localhost:8080
```

Stop the app:

```bash
docker compose down
```

## Current Scaffold Status

Epic 00 defines and verifies the Docker runtime shape before the application
scaffold exists. Until Epic 01 creates the Vite client files, the verified
runtime check is:

```bash
docker compose config
```

After Epic 01 creates `package.json`, the Vite build, and the static app,
`docker compose up --build` should build the client and serve the generated
`dist/` output through the single app container.
