# CatPlus ChemBoard Kubernetes Deployment

This directory contains Kubernetes manifests for deploying catplus-chemboard using [ytt](https://carvel.dev/ytt/).

## Quick Start

```bash
# Render manifests
just manifests render

# Deploy to Kubernetes
just manifests deploy

# Dry run
just manifests render | kubectl apply --dry-run=client -f-
```

## Structure

```
├── templates/      # YTT templates
│   └── lib/        # Shared libraries
├── schema.yaml     # Schema definition
└── values.yaml     # Default values
```

## Configuration

Edit `values.yaml` to configure:

- Application name and namespace
- Container image details
- S3 storage settings
- Ingress hostname
