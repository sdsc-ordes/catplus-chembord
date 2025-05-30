set positional-arguments
set dotenv-required
set shell := ["bash", "-cue"]

root_dir := `git rev-parse --show-toplevel`


# Default recipe to list all recipes.
[private]
default:
    just --list --no-aliases

alias fmt := format
# Format the whole repository.
format *args:
    treefmt {{args}}

install:
    pnpm install

build: install
    pnpm build

run: build
    node ./build/index.js

alias dev := develop
# Enter a Nix development shell.
develop *args:
  @echo "Starting nix developer shell in './tools/nix/flake.nix'."
  cmd=("$@") && \
    { [ -n "${cmd:-}" ] || cmd=("zsh"); } && \
    nix develop ./tools/nix#default --accept-flake-config --command "${cmd[@]}"

# Manage kubernetes manifests.
mod manifests 'tools/just/manifests.just'
# Manage container images.
mod image 'tools/just/image.just'
