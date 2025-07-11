[![pipeline](https://github.com/rumble-tech/wppd-collector/actions/workflows/run-tests.yml/badge.svg)](https://github.com/rumble-tech/wppd-collector/commit/main)
[![coverage](https://badges.maxlehmann.dev/badge/rumble-tech@wppd-collector/code-coverage)](https://github.com/rumble-tech/wppd-collector/actions)

# rumble WPPD collector

This API is part of the **Rumble WordPress plugin dashboard** project. \
\
It receives information about WordPress instances, enriches it and provides it via REST routes. \
A WordPress plugin designed to communicate with this API is found [here](https://github.com/rumble-tech/wppd-plugin).

## Installation

1. Checkout repository to your local machine.
2. Run `npm install` to install the dependencies.
3. Create a docker/compose.dev.override.yml file based on the example provided in docker/compose.dev.override.example.yml.

## Starting development environment

1. Make sure that all dependencies are installed and that the docker/compose.dev.override.yml file is created and valid.
2. Execute the command `npm run dev` to start the development environment.
3. Wait for the container to start and the API will be available at `http://localhost:YOUR_PORT_CONFIGURED_IN_COMPOSE_OVERRIDE_FILE`. \
   The response should show a message `Welcome to the API` and the project's current version.

### Note

In development mode, the `src` directory is mounted into the container so you can edit code locally and see changes live. \
Additionally, the `sqlite` and `logs` directories are mounted for data and log persistence.

## NPM scripts

| Script           | Description |
| ---------------- | ----------- |
| `build` | *Build the production docker image* |
| `dev:start` | *Build the development docker image and run it using the `docker/compose.dev.yml` and `docker/compose.dev.override.yml`* |
| `dev:stop` | *Stop the running development container* |
| `test` | *Build the test docker image and run it* |
| `migrate:create` | *Create a migration based on changes in the `src/components/database/Schema.ts` file* |

## Migrations

To create and apply database migrations, you have to follow these steps:

1. Make your changes in the `src/components/database/Schema.ts` file
2. Run `npm run migrate:create`
    - This will create a SQL file containing the changes in `src/components/database/migrations`.
3. Kill the running docker container and run `npm run dev` again. This will rebuild the docker image including the new migration.

## Testing

For testing Jest and Supertest is used. \
To ensure that the tests behave exactly like a production environment, the tests run inside a docker container. \
\
The `<rootDir>/coverage` directory is mounted into the test container, so that the result will be available after the run. \
\
By default two coverage reporters are configured (`text` and `coberture`). This is changeable in the `jest.config.ts`.

## Endpoints

### GET - `/`

- **Description**: Responds with HTTP status 200 and a welcome message
- **Request Body**: /
- **Response**:

| Status | Description | Data |
| --- | --- | --- |
| **200 - OK** | *The API is reachable* | `{ message: "Welcome to the API", data: { version: "CURRENT_PROJECT_VERSION" } }` |
| **500 - Internal Server Error** | *Something else went wrong* | - |

### GET - `/site`

- **Description**: Retries all sites
- **Request Body**: /
- **Response**:

| Status | Description | Data |
| --- | --- | --- |
| **200 - OK** | *Return all sites* | `{ message: "Sites retrieved successfully", data: [ { id: 1, name: "site-1", url: "https://example.com/site1", environment: "production" }, ... ] }` |
| **500 - Internal Server Error** | *Something else went wrong* | - |

### GET - `/site/{id}`

- **Description**: Retries a specific site
- **Request Body**: /
- **Response**:

| Status | Description | Data |
| --- | --- | --- |
| **200 - OK** | *Returns the requested site* | `{ message: "Site retrieved successfully", data: { id: 1, name: "site-1", url: "https://example.com/site-1", environment: "production", phpVersion: { installed: "8.2.29", latest: "8.4.0", diff: "minor" }, wpVersion: { installed: "6.8.1", latest: "6.8.1", diff: "same" } } }` |
| **400 - Bad Request** | *The siteId request parameter is invalid* | `{ message: "The parameter "siteId" is required and must be a non-empty number", data: null }` |
| **404 - Not Found** | *The requested site does not exist* | `{ message: "A site with the given ID does not exist", data: null }` |
| **500 - Internal Server Error** | *Something else went wrong* | - |

### GET - `/site/{id}/plugins`

- **Description**: Gets all plugins for a specific site
- **Request Body**: /
- **Response**:

| Status | Description | Data |
| --- | --- | --- |
| **200 - OK** | *Returns all plugins for the requested site* | `{ message: "Site Plugins retrieved successfully", data: [ { pluginId: 1, name: "The first plugin", slug: "plugin-1", installedVersion: { version: "1.0.0", requiredPhpVersion: "8.0.0", requiredWpVersion: "5.9.0" }, latestVersion: { version: "1.3.0", requiredPhpVersion: "8.1.0", requiredWpVersion: "6.0.0" }, versionDiff: "minor", isActive: true, vulnerabilities: [ { from: { version: "1.0.0", inclusive: true }, to: { version: "1.1.0", inclusive: true }, score: 5.0 }, ... ] }, ... ] }` |
| **400 - Bad Request** | *The siteId request parameter is invalid* | `{ message: "The parameter "siteId" is required and must be a non-empty number", data: null }` |
| **404 - Not Found** | *The requested site does not exist* | `{ message: "A site with the given ID does not exist", data: null }` |
| **500 - Internal Server Error** | *Something else went wrong* | - |

### POST - `/site/register`

- **Description**: Registers or re-registers a site
- **Request Body**:

```json
{
    "name": "site-1",
    "url": "https://example.com/site1",
    "environment": "production"
}
```

- **Response**:

| Status | Description | Data |
| --- | --- | --- |
| **200 - OK** | *The site was updated/re-registered successfully and generated a new token* | `{ message: "Site re-registered successfully", data: { id: 1, name: "site-1", url: "https://example.com/site-1", token: "RANDOM_64_CHAR_STRING"} }` |
| **201 - Created** | *The site was inserted/registered successfully* | `{ message: "Site registered successfully", data: { id: 1, name: "site-1", url: "https://example.com/site-1", token: "RANDOM_64_CHAR_STRING"} }` |
| **400 - Bad Request** | *The body field "name" is invalid* | `{ message: "The field "name" is required and must be a non-empty string", data: null }` |
| **400 - Bad Request** | *The body field "url" is invalid* | `{ message: "The field "url" is required and must be a non-empty string", data: null }` |
| **400 - Bad Request** | *The body field "environment" is invalid* | `{ message: "The field "name" is required and must be either "production", "staging", or "development"", data: null }` |
| **500 - Internal Server Error** | *The site could not be inserted/registered* | `{ message: "Failed to register site", data: null }` |
| **500 - Internal Server Error** | *The site could not be updated/re-registered* | `{ message: "Failed to re-register already registered site", data: null }` |
| **500 - Internal Server Error** | *Something else went wrong* | - |

### PUT - `/site/{id}/update`

- **Description**: Updates a site
- **Request Body**: /

```json
{
    "name": "site-1",
    "url": "https://example.com/site1",
    "phpVersion": "8.2.29",
    "wpVersion": "6.8.1",
    "plugins": [
        {
            "file": "akismet/akismet.php",
            "name": "Akismet",
            "active": false,
            "version": {
                "installedVersion": "1.0.0",
                "requiredPhpVersion": "2.0.0",
                "requiredWpVersion": "3.0.0"
            }
        }
    ]
}
```

- **Response**:

| Status | Description | Data |
| --- | --- | --- |
| **200 - OK** | *The site and it's plugins were updated sucessfully* | - |
| **400 - Bad Request** | *The body field "name" is invalid* | `{ message: "The field "name" is required and must be a non-empty string", data: null }` |
| **400 - Bad Request** | *The body field "url" is invalid* | `{ message: "The field "url" is required and must be a non-empty string", data: null }` |
| **400 - Bad Request** | *The body field "phpVersion" is invalid* | `{ message: "The field "phpVersion" is required and must be a valid version string", data: null }` |
| **400 - Bad Request** | *The body field "wpVersion" is invalid* | `{ message: "The field "wpVersion" is required and must be a valid version string", data: null }` |
| **400 - Bad Request** | *The body field "plugins" is invalid* | `{ message: "The field "plugins" is required and must be an array", data: null }` |
| **400 - Bad Request** | *The body field "file" in the plugins array is invalid* | `{ message: "The field "plugins[INDEX].file" is required and must be a string", data: null }` |
| **400 - Bad Request** | *The body field "name" in the plugins array is invalid* | `{ message: "The field "plugins[INDEX].name" is required and must be a string", data: null }` |
| **400 - Bad Request** | *The body field "active" in the plugins array is invalid* | `{ message: "The field "plugins[INDEX].active" is required and must be a boolean", data: null }` |
| **400 - Bad Request** | *The body field "version" in the plugins array is invalid* | `{ message: "The field "plugins[INDEX].version" is required and must be an object", data: null }` |
| **400 - Bad Request** | *The body field "version.installedVersion" in the plugins array is invalid* | `{ message: "The field "plugins[0].version.installedVersion" is required and must be a valid version string or null", data: null }` |
| **400 - Bad Request** | *The body field "version.requiredPhpVersion" in the plugins array is invalid* | `{ message: "The field "plugins[0].version.requiredPhpVersion" is required and must be a valid version string or null", data: null }` |
| **400 - Bad Request** | *The body field "version.requiredWpVersion" in the plugins array is invalid* | `{ message: "The field "plugins[0].version.requiredWpVersion" is required and must be a valid version string or null", data: null }` |
| **401 - Unauthorized** | *The authorization is missing* | `{ message: "Authorization header is required", data: null }` |
| **403 - Forbidden** | *The auhorization token is invalid* | `{ message: "Access denied: Invalid token", data: null }` |
| **500 - Internal Server Error** | *Something else went wrong* | - |
