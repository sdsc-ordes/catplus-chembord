# manifests.just - Kubernetes manifests management for Cat+ Chemboard
set positional-arguments
set shell := ["bash", "-cue"]
root_dir := `git rev-parse --show-toplevel`
deploy_dir := root_dir +  "/tools/deploy"

# Default recipe to list all recipes.
[private]
default:
  just --list manifests --no-aliases

# Render manifests
render:
  cd "{{root_dir}}" && \
    ytt -f {{deploy_dir}}/

alias apply := deploy
# Apply manifests to the cluster.
deploy:
  just manifests render \
    | kubectl apply -f-
