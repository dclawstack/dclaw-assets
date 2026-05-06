# Troubleshooting

Common issues and solutions for DClaw Assets.

## Quick Diagnostics

```bash
# Check app pods
kubectl get pods -n dclaw-assets

# Check logs
kubectl logs -n dclaw-assets deployment/dclaw-assets-backend

# Check database
kubectl get clusters -n dclaw-assets
```

## Sections

- [Common Issues](./common-issues)
- [FAQ](./faq)
