# Auth Quick Start 🚀

## TL;DR

```bash
# 1. Add to .env.local
VITE_API_BASE_URL=https://i41zn9fza8.execute-api.us-east-1.amazonaws.com/prod
VITE_TENANT_ID=tenant_1757418497028_g9o6mnb4m
VITE_KX_SERVICE_KEY=qhO4JD5yBBjVZbzRxnL-BhbapFTvPaSTYNVVu97JxzU

# 2. Restart dev server
npm run dev

# 3. Done! API calls now work without Cognito login
```

## How It Works

The frontend **automatically detects** auth mode:

| Environment | Auth Mode | Header Sent |
|------------|-----------|-------------|
| Dev/Staging with service key | Service Key | `x-service-key: xxx` |
| Production (no service key) | Cognito JWT | `Authorization: Bearer xxx` |

## Environment Files

### `.env.local` (dev - git-ignored)
```bash
VITE_API_BASE_URL=https://i41zn9fza8.execute-api.us-east-1.amazonaws.com/prod
VITE_TENANT_ID=tenant_1757418497028_g9o6mnb4m
VITE_KX_SERVICE_KEY=qhO4JD5yBBjVZbzRxnL-BhbapFTvPaSTYNVVu97JxzU
```

### `.env.production`
```bash
VITE_API_BASE_URL=https://api.example.com
VITE_TENANT_ID=your-production-tenant-id
# No service key - uses Cognito JWT
```

## Get Service Key

Ask your backend team for:
- Dev key: `kx-service-keys/dev`
- Staging key: `kx-service-keys/staging`

**Never commit service keys to git!**

## Verify It's Working

```typescript
// In browser console
import { getAuthMode, validateAuthConfig } from 'kx-axis-fe';

console.log(getAuthMode());
// => 'service-key' ✅

console.log(validateAuthConfig());
// => null (no errors) ✅
```

## Common Issues

### ❌ "Missing service key for dev auth"

**Fix:** Add `VITE_KX_SERVICE_KEY` to `.env.local` and restart dev server.

### ❌ API returns 401 Unauthorized

**Possible causes:**
- Service key is invalid/expired (get new one)
- Service key not loaded (restart dev server)
- In prod mode without JWT token (implement Cognito login)

### ❌ Changes not taking effect

**Fix:** Restart dev server after modifying `.env` files.

## Production Setup (TODO)

For production, you'll need to:

1. **Implement Cognito login** (not yet done)
2. **Store JWT token** in localStorage or cookies
3. **Refresh tokens** before expiration

For now, production requires manual token setup:
```javascript
localStorage.setItem('kx-id-token', 'your-jwt-token');
```

## Full Docs

- **`AUTH_SETUP.md`** - Complete auth guide
- **`GATEWAY_AUTH_MIGRATION.md`** - Technical details
- **`ENV_TEMPLATE.md`** - Environment variable reference

---

**Questions?** Contact the backend team or check `kx-aws/gateway-auth-strategy.md`.

