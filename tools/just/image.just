set positional-arguments
set shell := ["bash", "-cue"]
root_dir := `git rev-parse --show-toplevel`
ctr := env("CTR", "docker")
version := env("VERSION", `git describe --tags --abbrev=0`)
image := "ghcr.io/sdsc-ordes/catplus-chemboard:" + version
image_dir := root_dir + "/tools/image"

# Default recipe to list all recipes.
[private]
default:
  just --list image --no-aliases

# Build Docker images
build *args:
  cd {{root_dir}} && \
    {{ctr}} build \
      -f "{{image_dir}}/Dockerfile" \
      --build-arg VERSION={{version}} \
      -t {{image}} \
      {{args}} \
      .

# Run docker image
run *args: build
  @echo "🐋 Running docker image"
  cd {{root_dir}} && \
    {{ctr}} run \
      -it \
      --rm \
      --env-file .env \
      -p 8000:8000 \
      -p 8501:8501 \
      {{args}} \
      {{image}}

# Push Docker images
push *args: build
  @echo "🐋 Pushing docker image"
  cd {{root_dir}} && \
    {{ctr}} push {{args}} {{image}}
