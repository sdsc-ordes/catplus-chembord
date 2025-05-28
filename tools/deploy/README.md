# CatPlus ChemBoard Kubernetes Deployment

This directory contains Kubernetes manifests for deploying catplus-chemboard using [ytt](https://carvel.dev/ytt/).

## Quick Start

```bash
# Render manifests
just manifests render

# Deploy to Kubernetes
just manifests deploy

## Structure

```
├── templates/      # YTT templates
│   └── lib/        # Shared libraries
├── schema.yaml     # Schema definition
└── values.yaml     # Default values
```
