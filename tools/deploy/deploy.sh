#!/bin/bash
set -e

# Configuration and defaults
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV=${ENV:-"dev"}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"my-registry.example.com"}
IMAGE_NAME="catplus-chemboard"
IMAGE_TAG=${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}
BUILD_IMAGE=${BUILD_IMAGE:-"false"}
APPLY_MANIFESTS=${APPLY_MANIFESTS:-"true"}
DRY_RUN=${DRY_RUN:-"false"}
KUBE_CONTEXT=${KUBE_CONTEXT:-""}
SECRETS_FILE=${SECRETS_FILE:-""}
VALUES_DIR="${SCRIPT_DIR}/overlays"
TEMPLATES_DIR="${SCRIPT_DIR}/templates"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${GREEN}INFO:${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}WARN:${NC} $1"
}

log_error() {
  echo -e "${RED}ERROR:${NC} $1"
}

show_help() {
  echo "Usage: deploy.sh [options]"
  echo ""
  echo "Options:"
  echo "  -e, --env ENV            Environment to deploy to (dev, prod) [default: dev]"
  echo "  -r, --registry REGISTRY  Docker registry to use [default: my-registry.example.com]"
  echo "  -t, --tag TAG            Image tag [default: YYYYmmdd-HHMMSS]"
  echo "  -b, --build              Build and push Docker image [default: false]"
  -s, --secrets FILE       Path to secrets values file for ytt (will be validated against schema)
  echo "  -n, --no-apply           Generate manifests but don't apply them"
  echo "  -d, --dry-run            Perform a dry-run (don't actually apply changes)"
  echo "  -c, --context CONTEXT    Kubernetes context to use"
  echo "  -h, --help               Show this help message"
  echo ""
  echo "Example:"
  echo "  ./deploy.sh --env prod --build --registry my-registry.example.com --tag v1.0.0"
}

check_requirements() {
  local missing_tools=()

  # Check if ytt exists
  if ! command -v ytt &> /dev/null; then
    missing_tools+=("ytt")
  else
    # Check ytt version for schema support (needs 0.40.0+)
    YTT_VERSION=$(ytt version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    if [[ "$(echo -e "0.40.0\n$YTT_VERSION" | sort -V | head -n1)" == "$YTT_VERSION" ]] && 
       [[ "$YTT_VERSION" != "0.40.0" ]]; then
      log_warn "ytt version $YTT_VERSION detected. Schema validation requires v0.40.0+."
      log_warn "Consider upgrading ytt for better validation: https://carvel.dev/ytt/docs/latest/install/"
    fi
  fi

  if ! command -v kubectl &> /dev/null; then
    missing_tools+=("kubectl")
  fi

  if [ "$BUILD_IMAGE" = "true" ] && ! command -v docker &> /dev/null; then
    missing_tools+=("docker")
  fi

  if [ ${#missing_tools[@]} -ne 0 ]; then
    log_error "Missing required tools: ${missing_tools[*]}"
    echo "Please install the missing tools and try again."
    echo "  - ytt: https://carvel.dev/ytt/docs/latest/install/ (v0.40.0+ required for schema validation)"
    echo "  - kubectl: https://kubernetes.io/docs/tasks/tools/"
    echo "  - docker: https://docs.docker.com/get-docker/"
    exit 1
  fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--env)
      ENV="$2"
      shift 2
      ;;
    -r|--registry)
      DOCKER_REGISTRY="$2"
      shift 2
      ;;
    -t|--tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    -b|--build)
      BUILD_IMAGE="true"
      shift
      ;;
    -s|--secrets)
      SECRETS_FILE="$2"
      shift 2
      ;;
    -n|--no-apply)
      APPLY_MANIFESTS="false"
      shift
      ;;
    -d|--dry-run)
      DRY_RUN="true"
      shift
      ;;
    -c|--context)
      KUBE_CONTEXT="$2"
      shift 2
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Check for required tools
check_requirements

# Validate environment
if [[ ! "$ENV" =~ ^(dev|prod)$ ]]; then
  log_error "Invalid environment: $ENV. Must be one of: dev, prod"
  exit 1
fi

# Set environment-specific values file
ENV_VALUES_FILE="${VALUES_DIR}/${ENV}-values.yaml"
if [ ! -f "$ENV_VALUES_FILE" ]; then
  log_error "Environment values file not found: $ENV_VALUES_FILE"
  exit 1
fi

# Set Kubernetes context if provided
if [ -n "$KUBE_CONTEXT" ]; then
  log_info "Setting Kubernetes context to: $KUBE_CONTEXT"
  kubectl config use-context "$KUBE_CONTEXT"
fi

# Build and push Docker image if requested
if [ "$BUILD_IMAGE" = "true" ]; then
  log_info "Building Docker image: $IMAGE_NAME:$IMAGE_TAG"
  cd "${SCRIPT_DIR}/../../" || { log_error "Failed to navigate to project root"; exit 1; }
  
  docker build -t "$IMAGE_NAME:$IMAGE_TAG" .
  
  log_info "Tagging image for registry: $DOCKER_REGISTRY/$IMAGE_NAME:$IMAGE_TAG"
  docker tag "$IMAGE_NAME:$IMAGE_TAG" "$DOCKER_REGISTRY/$IMAGE_NAME:$IMAGE_TAG"
  
  log_info "Pushing image to registry"
  docker push "$DOCKER_REGISTRY/$IMAGE_NAME:$IMAGE_TAG"
  
  # If this is a production deployment, also tag and push as 'stable'
  if [ "$ENV" = "prod" ]; then
    log_info "Tagging and pushing stable image for production"
    docker tag "$IMAGE_NAME:$IMAGE_TAG" "$DOCKER_REGISTRY/$IMAGE_NAME:stable"
    docker push "$DOCKER_REGISTRY/$IMAGE_NAME:stable"
  fi
  
  cd "$SCRIPT_DIR" || { log_error "Failed to navigate back to script directory"; exit 1; }
fi

# Generate Kubernetes manifests with ytt
log_info "Generating Kubernetes manifests with ytt for environment: $ENV"

YTT_ARGS=(
  -f "$TEMPLATES_DIR/"
  -f "$SCRIPT_DIR/schema.yaml"
  -f "$SCRIPT_DIR/values.yaml"
  -f "$ENV_VALUES_FILE"
  --data-value "container.image.repository=$DOCKER_REGISTRY/$IMAGE_NAME"
)

# Add secrets file if provided
if [ -n "$SECRETS_FILE" ]; then
  if [ -f "$SECRETS_FILE" ]; then
    log_info "Using secrets file: $SECRETS_FILE"
    YTT_ARGS+=(-f "$SECRETS_FILE")
  else
    log_error "Secrets file not found: $SECRETS_FILE"
    exit 1
  fi
fi

# If building image, update the image tag in the manifests
if [ "$BUILD_IMAGE" = "true" ]; then
  YTT_ARGS+=(--data-value "container.image.tag=$IMAGE_TAG")
fi

# Generate manifests
log_info "Validating configuration using schema..."
# First run with --data-values-schema-inspect to validate against schema
if ! ytt "${YTT_ARGS[@]}" --data-values-schema-inspect > /dev/null 2>&1; then
  log_error "Schema validation failed. Please check your values against the schema."
  ytt "${YTT_ARGS[@]}" --data-values-schema-inspect
  exit 1
fi

log_info "Configuration validated successfully. Generating manifests..."
log_info "Executing ytt with arguments: ${YTT_ARGS[*]}"
MANIFESTS=$(ytt "${YTT_ARGS[@]}")

# Output directory for generated manifests
MANIFESTS_DIR="${SCRIPT_DIR}/generated-manifests"
mkdir -p "$MANIFESTS_DIR"
MANIFESTS_FILE="${MANIFESTS_DIR}/manifests-${ENV}-$(date +%Y%m%d-%H%M%S).yaml"

echo "$MANIFESTS" > "$MANIFESTS_FILE"
log_info "Generated manifests saved to: $MANIFESTS_FILE"

# Apply manifests if requested
if [ "$APPLY_MANIFESTS" = "true" ]; then
  log_info "Applying Kubernetes manifests"
  
  KUBECTL_ARGS=("apply" "-f" "-")
  
  if [ "$DRY_RUN" = "true" ]; then
    log_info "Performing dry-run (no changes will be applied)"
    KUBECTL_ARGS+=("--dry-run=client")
  fi
  
  echo "$MANIFESTS" | kubectl "${KUBECTL_ARGS[@]}"
  
  if [ "$DRY_RUN" = "false" ]; then
    log_info "Deployment completed successfully!"
    log_info "To check status, run: kubectl get pods -n catplus-chemboard"
  else
    log_info "Dry run completed successfully!"
  fi
else
  log_info "Manifests generated but not applied (--no-apply option used)"
  log_info "To apply manually, run: kubectl apply -f $MANIFESTS_FILE"
fi