<p align="center">
  <a href="https://autoverify.atlassian.net/wiki/spaces/PS/overview" target="blank"><img src="https://i.postimg.cc/XJ6rtmyS/Platform-Services.png" width="200" alt="Platform Service Logo" /></a>
  <h1 align="center">Configurable Module Example</h1>
</p>



- [Application Environment Variables](#application-environment-variables)
- [Development Environment Dependencies](#development-environment-dependencies)
  - [AWS CLI Installation and Setup](#aws-cli-installation-and-setup)
  - [`NodeJS` and `npm` Installation](#nodejs-and-npm-installation)
  - [`npm` CodeArtifact Configuration](#npm-codeartifact-configuration)
  - [Install Application Dependencies using `npm`](#install-application-dependencies-using-npm)
  - [`.env` File](#env-file)
- [Running the Application (Bare Metal)](#running-the-application-bare-metal)
- [Running the Application (Docker)](#running-the-application-docker)
  - [Docker Image Arguments](#docker-image-arguments)
  - [`release` Target](#release-target)
    - [Environment Variables](#environment-variables)
- [Other Useful `npm` Scripts](#other-useful-npm-scripts)
  - [Compile the project](#compile-the-project)
  - [Running Tests](#running-tests)
  - [Auto Linting/Formatting](#auto-lintingformatting)

# Application Environment Variables

The following is a list of environment variables this application consumes:

| Variable              | Assumed Type | Required | Description                                                              |
| --------------------- | ------------ | -------- | ------------------------------------------------------------------------ |
| APP_PORT              | integer      | yes      | port to run the application on                                           |
| LOG_LEVEL             | string       | yes      | minimum log level displayed in app logs                                  |
| LOG_PATH              | string       | no       | directory to create log files in - omit to disable file logging          |
| AUTH0_DOMAIN          | string       | yes      | the Auth0 domain URL                                                     |
| AUTH0_AUDIENCE        | string       | yes      | the Auth0 audience (usually `platform-services`)                         |
| AUTH0_ENABLED         | string       | yes      | `true` to enable authentication for local development, `false` otherwise |
| BUGSNAG_API_KEY       | string       | yes      | the bugsnag key for the application                                      |
| BUGSNAG_RELEASE_STAGE | string       | yes      | the bugsnag release stage for the deployment                             |

# Development Environment Dependencies

There are several ways to run the application:
- on bare metal
- using docker

In both cases, it is highly recommended that you install `node`, `npm`, and the `AWS CLI` on your local machine for development.

## AWS CLI Installation and Setup

See https://autoverify.atlassian.net/wiki/spaces/TKB/pages/3212804098/Setup+AWS+CLI

## `NodeJS` and `npm` Installation

Ensure you have installed the correct versions of `Node` and `npm`.  It is recommended that you use `nvm` (the `Node Version Manager` to do this). See https://autoverify.atlassian.net/wiki/spaces/PS/pages/3569025056/Node+Version+Management. The following minimum versions are required:

- node: `v22.13.1`
- npm: `10.9.2`

## `npm` CodeArtifact Configuration

This project uses a private NPM Store via AWS CodeArtifact. You need to be able to log into AWS using the AWS CLI _and_ configure your `npm` to use it.

```bash
$ aws codeartifact login \
    --tool npm \
    --repository platform \
    --domain autoverify \
    --domain-owner <AWS-ACCOUNT-ID> \
    --region us-east-1
```
See also https://autoverify.atlassian.net/wiki/spaces/PS/pages/3575709698/AWS+CodeArtifact+NPM+Store

## Install Application Dependencies using `npm`

Install dependencies:
```bash
$ npm install
```
> [!NOTE]
> the `npm install` command will automatically install (using the `prepare` script) some `git` hooks managed via the `husky` dependency.  See [Git Pre-commit Hooks and Husky](https://autoverify.atlassian.net/wiki/spaces/PS/pages/3701014530/Git+Pre-commit+Hooks+and+Husky) for details.

## `.env` File

This project consumes environment variables, but for ease of use, can also consume a `.env` file located in the project root. A reference for this file can be found in `.env.example`. This file can be copied to `.env` and then modified as necessary.

> [!IMPORTANT]
> The `.env` file does not _override_ existing environment variables.

> [!NOTE]
> Not all environment variables are _required_ - review the [Application Environment Variables](#application-environment-variables) to determine what environment variables are required in the `.env` file.

# Running the Application (Bare Metal)

To run the project on your PC without docker, you can use the following:
```bash
# development
$ npm run start

# development, watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

> [!NOTE]
> The difference between `development` and `production` is in how the application is launched: using the `NestCLI` or via `node`. `production` mode assumes the application has been built via `npm run build`.

# Running the Application (Docker)

> [!IMPORTANT]
> In order to build the docker image, you _must_ have logged into `AWS CodeArtifact` using the `AWS CLI` with valid credentials. Doing so expects an `.npmrc` file to be generated in your `$HOME` directory that will be passed into the docker image as part of the image build process.

## Docker Image Arguments
The docker image has several inputs:

| Build Argument | Required | Default Value | Description                             |
| -------------- | -------- | ------------- | --------------------------------------- |
| BUILD_VERSION  | no       | 'unknown'     | a string representing the build version |
| BUILD_NUMBER   | no       | 'unknown'     | a string representing the build number  |

> [!NOTE]
> The build number/version values are stamped into the docker image by the CI/CD pipeline - if not provided, `unknown` will be used in place.

| Secret | Required | Description                                                  |
| ------ | -------- | ------------------------------------------------------------ |
| npmrc  | yes      | an `.npmrc` file containing credentials for AWS CodeArtifact |

> [!NOTE]
> The CI/CD pipeline will inject the appropriate `npmrc` secret during image build - for local builds, the `docker-compose` file will auto-inject your local `$HOME/.npmrc` file - you must ensure that `npm` on your host machine is logged in to `AWS CodeArtifact` before building the image for this to work properly.

## `release` Target

The release target is used by the standard CI/CD process to generate releasable docker images that will be stored on `AWS ECR`.

You can manually build a release image using the following command:
```bash
$ DOCKER_BUILDKIT=1 docker build \
    --tag platform/configurable-module-example-rest-api \
    --build-arg BUILD_NUMBER=dev-release \
    --build-arg BUILD_VERSION=dev-release \
    --secret id=npmrc,src=$HOME/.npmrc \
    --target release .
```

### Environment Variables

In addition to the [Application Environment Variables](#application-environment-variables), the `release` target requires these environment variables to run Filebeat:

| Variable            | Assumed Type | Required | Description                              |
| ------------------- | ------------ | -------- | ---------------------------------------- |
| FILEBEAT_CLOUD_ID   | string       | yes      | Elastic Cloud cluster ID                 |
| FILEBEAT_CLOUD_AUTH | string       | yes      | Elastic Cloud authentication credentials |

> [!NOTE]
> These variables are used by Filebeat for centralized log shipping to Elastic Cloud. They are not needed for the `development` target.

You can run the release image using the following command (note that you will need to fill in the expected environment variables):
```bash
$ docker run -d \
    --name configurable-module-example-rest-api \
    -p 8000:80 \
    -e APP_PORT=80 \
    -e LOG_LEVEL=debug \
    -e LOG_PATH=/var/log/configurable-module-example-rest-api \
    -e AUTH0_ENABLED=true \
    -e AUTH0_DOMAIN=dev-0k8m6aqc.us.auth0.com \
    -e AUTH0_AUDIENCE=platform-services \
    -e BUGSNAG_API_KEY= \
    -e BUGSNAG_RELEASE_STAGE=local \
    -e FILEBEAT_CLOUD_ID=logging-alerting-metrics:dXMtZWFzdC0xLmF3cy5mb3VuZC5pbyQ3YjcwNzEwNzgxMTE0NDc5YWJkNDg4MDExZTdmY2Q4YSQzNzIzZDI1NGJlMTU0Nzk5OGU5NmViMzA5Y2EyNjEwMA== \
    -e FILEBEAT_CLOUD_AUTH=<filebeat_cloud_auth> \
    platform/configurable-module-example-rest-api
```

> [!WARNING]
> Release images are intended to be run in a production environment (`AWS ECS`) and may trigger unintended behaviour in that environment - use with caution!

# Other Useful `npm` Scripts

## Compile the project

Running the project using `npm run start` will automatically re-build the project, but you can also run the TypeScript transpile process manually without starting the application:

```bash
$ npm run build
```
## Running Tests

Unit tests are built using the `jest` testing framework.  End-to-end tests are handled using `supertest`.

```bash
# unit tests
$ npm run test

# unit tests, watch mode
$ npm run test:watch

# unit tests, debug mode
$ npm run test:debug

# test unit tests with coverage report
$ npm run test:cov

# run end-to-end tests
$ npm run test:e2e
```

## Auto Linting/Formatting

```bash
# Using prettier to format
$ npm run format

# Running esLint
$ npm run lint
```
