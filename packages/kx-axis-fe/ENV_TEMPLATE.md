# Environment Variables Template

Copy these variables to your `.env.local` file:

```bash
# API Base URL (required)
VITE_API_BASE_URL=http://localhost:3001

# Tenant ID (required)
VITE_TENANT_ID=tenant_1757418497028_g9o6mnb4m

# Service Key for Dev/Staging (optional)
# When set in dev/staging, bypasses Cognito and uses service key auth
# DO NOT SET IN PRODUCTION
# VITE_KX_SERVICE_KEY=your-service-key-here
```

## Dev/Staging Setup

```bash
# .env.local
VITE_API_BASE_URL=https://i41zn9fza8.execute-api.us-east-1.amazonaws.com/prod
VITE_TENANT_ID=tenant_1757418497028_g9o6mnb4m
VITE_KX_SERVICE_KEY=qhO4JD5yBBjVZbzRxnL-BhbapFTvPaSTYNVVu97JxzU
```

## Production Setup

```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_TENANT_ID=your-production-tenant-id
# DO NOT SET VITE_KX_SERVICE_KEY - will use Cognito JWT
```

See `AUTH_SETUP.md` for full documentation.

