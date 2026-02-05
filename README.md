[![pipeline](https://github.com/rumble-tech/wppd-collector/actions/workflows/test.yml/badge.svg)](https://github.com/rumble-tech/wppd-collector/commit/main)

# Rumble WPPD Collector

This API is part of the **Rumble WordPress plugin dashboard** project. \
\
It receives data about WordPress instances, enriches it and provides it via an REST API.\
A WordPress plugin designed for communicating with this API is
available [here](https://github.com/rumble-tech/wppd-plugin).

## Installation

1. Checkout this repository on your local machine.
2. Run `npm install` to install the dependencies.
3. Create a `.docker/compose.dev.override.yml`file based on the example `.docker/compose.dev.override.example.yml` file.

## Starting the development environment

1. Make sure that all dependencies are installed and the `.docker/compose.dev.override.yml` file is created and valid.
2. Execute the command `npm run dev:start` to start the development environment using Docker Compose.
3. Wait for the container to start and the API will be available at
   `http://localhost:YOUR_PORT_CONFIGURED_IN_COMPOSE_OVERRIDE_FILE`.

### Note

In development, the `src` directory is mounted into the container, so any changes made to the source code will be
reflected immediately without needing to rebuild the Docker image.\
Additionally the `sqlite` and `logs` directories are also mounted into the container to persist data and logs between
container restarts.

## NPM Scripts

| Script       | Description                                                                                  |
|--------------|----------------------------------------------------------------------------------------------|
| `dev:start`  | Starts the development environment using Docker Compose.                                     |
| `dev:stop`   | Stops the development environment using Docker Compose.                                      |
| `test`       | Builds a Docker image and runs the test suite inside a container.                            |
| `db:migrate` | Creates a new migration file based on changes in the `src/services/database/Schema.ts` file. |
| `build`      | Builds the Docker image for production deployment.                                           |

## Migrations

To create and apply database migrations, follow these steps:

1. Make your changes to the database schema in the `src/services/database/Schema.ts` file.
2. Run the `npm run db:migrate` command to generate a new migration file based on the changes.
3. Stop the development environment if it is running using the `npm run dev:stop` command`.
4. Start the development environment again using the `npm run dev:start` command. The new migration will be applied
   automatically when the application starts.

## Testing

For testing [jest](https://jestjs.io/) and [supertest](https://www.npmjs.com/package/supertest) are used.\
To ensure that the tests behave exactly like a production environment, the tests are executed inside a Docker
container.\
\
The `<rootDir>/coverage` directory is mounted into the container to persist the coverage reports between test runs.\
\
By default `text` and `cobertura` are configured as coverage reporters.\
You can adjust this in the `jest.config.ts` file.

## Endpoints

### GET - `/`

**Description**: Responds with a simple message indicating that the API is running.\
**Example Success Response**:

```json
{
  "status": 200,
  "body": {
    "message": "Welcome to the API!",
    "data": {
      "NODE_ENV": "CURRENT_PROJECT_ENVIRONMENT"
    }
  }
}
```

**Error Responses**:

| Status Code                     | Description       | Data                                                   |
|---------------------------------|-------------------|--------------------------------------------------------|
| **500 - Internal Server Error** | An error occurred | `{ "message": "Internal Server Error", "data": null }` |

### GET - `/site`

**Description**: Retrieves all sites\
**Example Success Response**:

```json
{
  "status": 200,
  "body": {
    "message": "Successfully retrieved all sites",
    "data": [
      {
        "id": 1,
        "name": "Site 1",
        "url": "https://example.com/site1",
        "environment": "production"
      },
      {
        "id": 2,
        "name": "Site 2",
        "url": "https://example.com/site2",
        "environment": "staging"
      },
      {
        "id": 3,
        "name": "Site 3",
        "url": "https://example.com/site3",
        "environment": "development"
      }
    ]
  }
}
```

**Error Responses**:

| Status Code                     | Description       | Data                                                   |
|---------------------------------|-------------------|--------------------------------------------------------|
| **500 - Internal Server Error** | An error occurred | `{ "message": "Internal Server Error", "data": null }` |

### GET - `/site/{siteId}`

**Description**: Retrieves a single site\
**Example Success Response**:

```json
{
  "status": 200,
  "body": {
    "message": "Successfully retrieved site",
    "data": {
      "id": 1,
      "name": "Site 1",
      "url": "https://example.com/site1",
      "environment": "production",
      "phpVersion": {
        "installed": "8.5.1",
        "latest": "8.5.2",
        "difference": "patch"
      },
      "wpVersion": {
        "installed": "6.8.0",
        "latest": "6.9.0",
        "difference": "minor"
      }
    }
  }
}
```

**Error Responses**:

| Status Code                     | Description              | Data                                                                                           |
|---------------------------------|--------------------------|------------------------------------------------------------------------------------------------|
| **400 - Bad Request**           | Invalid siteId parameter | `{ "message": "The parameter "siteId" is required and must be a valid number", "data": null }` |
| **404 - Not Found**             | Unknown siteId           | `{ "message": "Failed to find a site with the given Id", "data": null }`                       |
| **500 - Internal Server Error** | An error occurred        | `{ "message": "Internal Server Error", "data": null }`                                         |

### GET - `/site/{siteId}/plugins`

**Description**: Retrieves all plugins for a specific site\
**Example Success Response**:

```json
{
  "status": 200,
  "body": {
    "message": "Successfully retrieved site plugins",
    "data": {
      "id": 1,
      "slug": "plugin-1",
      "name": "The first plugin",
      "installedVersion": {
        "version": "1.0.0",
        "requiredPhpVersion": "7.0.0",
        "requiredWpVersion": "5.0.0"
      },
      "latestVersion": {
        "version": "2.0.0",
        "requiredPhpVersion": "8.0.0",
        "requiredWpVersion": "6.0.0"
      },
      "versionDifference": "major",
      "isActive": true,
      "vulnerabilities": {
        "count": 1,
        "maxSeverity": 5,
        "details": [
          {
            "description": "The first vulnerability for plugin-1",
            "publishedAt": "2026-01-01T00:00:00.000Z",
            "severity": 5,
            "references": "https://example.com/plugin1/vulnerability1",
            "fromVersion": {
              "version": "*",
              "inclusive": true
            },
            "toVersion": {
              "version": "2.0.0",
              "inclusive": false
            }
          }
        ]
      }
    }
  }
}
```

**Error Responses**:

| Status Code                     | Description              | Data                                                                                           |
|---------------------------------|--------------------------|------------------------------------------------------------------------------------------------|
| **400 - Bad Request**           | Invalid siteId parameter | `{ "message": "The parameter "siteId" is required and must be a valid number", "data": null }` |
| **404 - Not Found**             | Unknown siteId           | `{ "message": "Failed to find a site with the given Id", "data": null }`                       |
| **500 - Internal Server Error** | An error occurred        | `{ "message": "Internal Server Error", "data": null }`                                         |

### POST - `/site`

**Description**: Registers or re-registers a site\
**Example Request Body**:

```json
{
  "name": "Site 1",
  "url": "https://example.com/site1",
  "environment": "production"
}
```

**Example Success Responses**:

```json
{
  "status": 201,
  "body": {
    "message": "Successfully registered site",
    "data": {
      "id": 1,
      "name": "Site 1",
      "url": "https://example.com/site1",
      "apiKey": "RANDOM_64_CHARACTER_STRING",
      "environment": "production"
    }
  }
}
```

```json
{
  "status": 200,
  "body": {
    "message": "Successfully re-registered site",
    "data": {
      "id": 1,
      "name": "Site 1",
      "url": "https://example.com/site1",
      "apiKey": "RANDOM_64_CHARACTER_STRING",
      "environment": "production"
    }
  }
}
```

**Error Responses**:

| Status Code                     | Description               | Data                                                                                                                             |
|---------------------------------|---------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| **400 - Bad Request**           | Invalid name field        | `{ "message": "The field "name" is required and must be a non-empty string", "data": null }`                                     |
| **400 - Bad Request**           | Invalid url field         | `{ "message": "The field "url" is required and must be a non-empty string", "data": null }`                                      |
| **400 - Bad Request**           | Invalid environment field | `{ "message": "The field "environment" is required and must either be "production", "staging" or "development"", "data": null }` |
| **500 - Internal Server Error** | Failed to create site     | `{ "message": "Failed to create site", "data": null }`                                                                           |
| **500 - Internal Server Error** | Failed to update site     | `{ "message": "Failed to update site", "data": null }`                                                                           |
| **500 - Internal Server Error** | An error occurred         | `{ "message": "Internal Server Error", "data": null }`                                                                           | 

### PUT - `/site/{siteId}`

**Description**: Updates a site\
**Example Request Body**:

```json
{
  "name": "Site 1",
  "url": "https://example.com/site1",
  "phpVersion": "8.5.0",
  "wpVersion": "6.8.0",
  "plugins": [
    {
      "file": "plugin-1/plugin-1.php",
      "name": "The first plugin",
      "active": true,
      "version": {
        "installedVersion": "1.0.0",
        "requiredPhpVersion": "7.0.0",
        "requiredWpVersion": "5.0.0"
      }
    }
  ]
}
```

**Example Success Response**:

```json
{
  "status": 200,
  "headers": {
    "X-Auth-Token": "RANDOM_64_CHARACTER_STRING"
  },
  "body": {
    "message": "Successfully updated site",
    "data": {
      "id": 1,
      "name": "Site 1",
      "url": "https://example.com/site1",
      "environment": "production",
      "phpVersion": "8.5.0",
      "wpVersion": "6.8.0"
    }
  }
}
```

**Error Responses**:

| Status Code                     | Description                                        | Data                                                                                                                                    |
|---------------------------------|----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| **400 - Bad Request**           | Invalid siteId parameter                           | `{ "message": "The parameter "siteId" is required and must be a valid number", "data": null }`                                          |
| **400 - Bad Request**           | Invalid name field                                 | `{ "message": "The field "name" is required and must be a non-empty string", "data": null }`                                            |
| **400 - Bad Request**           | Invalid url field                                  | `{ "message": "The field "url" is required and must be a non-empty string", "data": null }`                                             |
| **400 - Bad Request**           | Invalid phpVersion field                           | `{ "message": "The field "phpVersion" is required and must be a valid version string", "data": null }`                                  |
| **400 - Bad Request**           | Invalid wpVersion field                            | `{ "message": "The field "wpVersion" is required and must be a valid version string", "data": null }`                                   |
| **400 - Bad Request**           | Invalid plugins field                              | `{ "message": "The field "plugins" is required and must be an array", "data": null }`                                                   |
| **400 - Bad Request**           | Invalid plugins[].file field                       | `{ "message": "The field "plugins[].file" is required and must be a string", "data": null }`                                            |
| **400 - Bad Request**           | Invalid plugins[].name field                       | `{ "message": "The field "plugins[].name" is required and must be a string", "data": null }`                                            |
| **400 - Bad Request**           | Invalid plugins[].active field                     | `{ "message": "The field "plugins[].active" is required and must be a boolean", "data": null }`                                         |
| **400 - Bad Request**           | Invalid plugins[].version field                    | `{ "message": "The field "plugins[].version" is required and must be an object", "data": null }`                                        |
| **400 - Bad Request**           | Invalid plugins[].version.installedVersion field   | `{ "message": "The field "plugins[].version.installedVersion" is required and must be a valid version string or null", "data": null }`  |
| **400 - Bad Request**           | Invalid plugins[].version.requiredPhpVersion field | `{ "message": The field "plugins[].version.requiredPhpVersion" is required and must be a valid version string or null", "data": null }` |
| **400 - Bad Request**           | Invalid plugins[].version.requiredWpVersion field  | `{ "message": "The field "plugins[].version.requiredWpVersion" is required and must be a valid version string or null", "data": null }` |
| **401 - Unauthorized**          | The X-Auth-Token Header is missing                 | `{ "message": "The "X-Auth-Token" header is required", "data": null }`                                                                  |
| **403 - Forbidden**             | The X-Auth-Token Header is invalid                 | `{ "message": "The "X-Auth-Token" header is invalid", "data": null }`                                                                   |
| **404 - Not Found**             | Unknown siteId                                     | `{ "message": "Failed to find a site with the given Id", "data": null }`                                                                |
| **500 - Internal Server Error** | Failed to update site                              | `{ "message": "Failed to update site", "data": null }`                                                                                  |
| **500 - Internal Server Error** | An error occurred                                  | `{ "message": "Internal Server Error", "data": null }`                                                                                  |