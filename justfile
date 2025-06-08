# justfile

set positional-arguments
set dotenv-required
set shell := ["bash", "-cue"]

# --- Variables ---
root_dir := `git rev-parse --show-toplevel`

# --- Recipes ---

# Default recipe to list all recipes.
[private]
default:
    just --list --no-aliases

alias fmt := format
# Format the whole repository.
format *args:
    treefmt {{args}}

# Clean build artifacts and caches
clean:
    @echo "🧹 Cleaning up old build artifacts and caches..."
    @rm -rf build .svelte-kit
    @echo "✅ Clean up complete."

# Install dependencies
install:
    @echo "📦 Installing dependencies with pnpm..."
    pnpm install

# Build the application for production
# Depends on 'install'. 'export BASE_PATH' from above will be used here.
build: install
    @echo "🚀 Building the application..."
    pnpm build
    @echo "✅ Build complete."

# Run the production server
# Depends on 'build'. 'export BASE_PATH' from above will be used here.
run: build
    @echo "▶️  Starting production server..."
    @echo "Listening on http://0.0.0.0:3000{{BASE_PATH}}"
    node --env-file=.env ./build/index.js

# Run the local development server
local:
    pnpm dev

# For debugging the environment variable
check-env:
    @echo "--- Checking environment from within a 'just' recipe ---"
    @echo "The BASE_PATH *shell* variable is:"
    @env | grep BASE_PATH || echo "BASE_PATH is NOT SET in the shell"
    @env | grep ORIGIN || echo "ORIGIN is NOT SET in the shell"
    @echo "--- End of check ---"

# --- Aliases and Modules (your other recipes are fine) ---
alias fmt := format
format *args:
    treefmt {{args}}

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
