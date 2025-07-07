# Catplus Chembord

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).


## Quickstart

The easy way to run the project is to use docker.

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
