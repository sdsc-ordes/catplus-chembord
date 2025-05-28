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

## S3 Configuration

All S3 configuration is stored in a single Kubernetes Secret. You can provide S3 credentials in three ways:

### Option 1: Using environment variables

```bash
export AWS_REGION=us-east-1
export AWS_S3_ENDPOINT=https://s3.example.com
export S3_BUCKET_NAME=my-bucket
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
just manifests deploy
```

### Option 2: Using an existing Kubernetes secret

Set `s3.existingSecret` in values.yaml:

```yaml
s3:
  existingSecret: "my-s3-credentials"  # Secret must contain all S3 config keys
```

### Option 3: Using a secrets file

Create a separate file with your S3 configuration:

```yaml
#@data/values
---
s3:
  region: us-east-1
  endpoint: https://s3.example.com
  bucketName: my-bucket
  accessKeyId: your-access-key
  secretAccessKey: your-secret-key
```

Then deploy with:

```bash
just manifests render -f your-secrets.yaml | kubectl apply -f-
```

## Advanced Usage

Override specific values:

```bash
just manifests render --data-value image.tag=latest --data-value ingress.host=app.example.com
```

For complex configurations, use YTT overlays.
