# Catplus Chembord

## About

### Part of a datasharing infrastructure

The HT-Chembord is part of the CAT+ Datasharing infrastructure:

It relies on these other repositories:

- Ontology: [catplus-ontology](https://github.com/sdsc-ordes/catplus-ontology)
- Converters: [catplus-converters](https://github.com/sdsc-ordes/catplus-converters)
- Kubernetes Deployment (private, contact project leads): [catplus-manifests](https://github.com/sdsc-ordes/catplus-manifests) (includes argo workflows, qlever RDF database, UI, s3 integration)

### Purpose

The HT-Chemboard has two pages:
- `data` route: allows to search the data that is stored on S3
- `search` route: allows to search the data, by querying the Qlever instance of Cat+, that stores data that has been converted to S3.

### Architecture

This is a [sveltekit app](https://svelte.dev/) that has been setup with [Skeleton](https://www.skeleton.dev/).

## Prerequisites

The projects expects:
- the S3 instance of the Cat+ project
- a Qlever instance with files that have been converted by the [catplus-converters](https://github.com/sdsc-ordes/catplus-converters)

The credentials for these infrastruture need to be provided in a `.env` file:

```
cp .env.example .env
```

Then fill in the credentials.

Now you can start the ui locally:

```
just local
```

###

In order to deploy it to Kubernetes you need manifests.



First, define your .env file by copying the example:

```bash
cp .env.example .env

# Edit .env
```

> NOTE: changing the BASE_PATH requires rebuilding the image

Then let docker run the container with variables loaded from the env file:
```bash
docker run -p 3000:3000 --env-file .env ghcr.io/sdsc-ordes/catplus-chembord:latest
```

## Development Environment

### Pre-requisites

The development setup requires the following:
* nix
* just

Additionally, we recommend using direnv to automatically activate the development environment when entering the project directory.

### Setup

### Usage

Then use just to install, build and run the project:

```bash
just install
just build
just run # this also installs and builds the project
```

### Docker

The docker image can be built using `just image` subcommands:

```bash
just image build
just image push # this also builds the image
```

### Kubernetes

Manifests are defined in `tools/deploy`. The templates can be rendered with default values using:

```bash
just manifests render
```

And deployed with

```bash
just manifests deploy
```
