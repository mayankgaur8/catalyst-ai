# Azure App Service Deployment Checklist

## Pre-Deployment (Local)

- [ ] Run `npm run build` and verify `test -f .next/standalone/server.js`
- [ ] Verify [.github/workflows/deploy-azure-app-service.yml](.github/workflows/deploy-azure-app-service.yml) packaging:
  - `rm -rf deploy && mkdir -p deploy`
  - `cp -R .next/standalone/. deploy/`
  - `cp -R .next/static/. deploy/.next/static/`
  - `test -f deploy/server.js` ✓

## GitHub Actions Deployment

- [ ] Trigger workflow:
  - **Actions** → **Deploy to Azure App Service** → **Run workflow**
  - Or push to `main` branch (auto-trigger)
- [ ] Wait for **Build & Deploy to Azure** job to complete
- [ ] Check logs for deployment success

## Azure Portal Configuration

### Startup Command

1. Go to **catalyst-ai-mayank** → **Configuration** → **General settings**
2. Set **Startup Command** to:
   ```
   node server.js
   ```
3. **Save** and **Restart** the app

### Application Settings

Verify these exist in **Configuration** → **Application settings**:

| Key | Value | Required |
|-----|-------|----------|
| `NODE_ENV` | `production` | ✓ |
| `PORT` | `8080` | ✓ |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~22` | ✓ |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` | ✓ |
| `ENABLE_ORYX_BUILD` | `false` | ✓ |
| `DATABASE_URL` | `postgresql://...` | ✓ |
| `SESSION_SECRET` | (32+ char random string) | ✓ |
| `ADMIN_EMAILS` | `admin@yourdomain.com,ops@yourdomain.com` | ✓ |
| `GROQ_API_KEY` | (from env) | If using |
| `GEMINI_API_KEY` | (from env) | If using |
| `OPENROUTER_API_KEY` | (from env) | If using |
| `AI_SESSION_SECRET` | (from env) | If using |
| `REDIS_URL` | (if using BullMQ) | If using |

## Post-Deployment Verification

### Via Kudu Console

Open: `https://catalyst-ai-mayank.scm.azurewebsites.net/DebugConsole`

```bash
# Verify artifact structure
cd /home/site/wwwroot
ls -la

# Should see:
# -rw-r--r--  ... server.js        <- MUST be at root
# drwxr-xr-x  ... .next
# drwxr-xr-x  ... public
# drwxr-xr-x  ... node_modules

# Verify no old structure
test -f server.js && echo "✓ server.js at root" || echo "✗ MISSING server.js"
test ! -d standalone && echo "✓ No standalone/ folder" || echo "⚠ Old standalone/ exists"
```

### Via HTTP

```bash
# Test health endpoint
curl https://catalyst-ai-mayank.azurewebsites.net/api/health

# Expected: {"ok": true} or similar
```

### Via Azure Portal Logs

**App Service** → **Log stream** or **Diagnose and solve problems**

Should show:
```
Starting node app.js
Server listening on port 8080
```

NOT:
```
Cannot find module '/home/site/wwwroot/standalone/server.js'
```

## Troubleshooting

### Issue: Still seeing `standalone/server.js` error

1. **Check startup command:**
   - Azure Portal → Configuration → General settings → Startup Command
   - Should be: `node server.js` (not `node standalone/server.js`)
   - Save and Restart

2. **Clear old artifact:**
   ```bash
   # Via Kudu console
   rm -rf /home/site/wwwroot/*
   rm -rf /home/site/deployments/*
   ```

3. **Redeploy:**
   - GitHub Actions → Deploy to Azure App Service → Run workflow
   - Wait for completion
   - Restart app service

### Issue: App starts but returns 500 errors

1. Check app settings exist (see table above)
2. Check `DATABASE_URL` is valid
3. Check logs: **App Service** → **Log stream**

### Issue: Deployment takes too long

1. Check **Deployment Center** → **Logs**
2. Check GitHub Actions workflow is not failing
3. Large `node_modules` can slow deployment; pre-bundling helps

## Publishing/Redeploying

**Do NOT manually publish to `/home/site/wwwroot/`**

Always use GitHub Actions workflow:
1. Merge PR or push to `main`
2. Workflow auto-triggers
3. Artifact packaged and deployed automatically
4. Restart app if needed (usually auto-restart on deploy)

## Notes

- Next.js standalone output: `.next/standalone/server.js` (local build)
- Deployed root: `/home/site/wwwroot/server.js` (Azure)
- Startup command must be: `node server.js` (NOT `node standalone/server.js`)
- Node 22 LTS required; set `WEBSITE_NODE_DEFAULT_VERSION=~22`
- Disable Oryx build to speed up deployment: `ENABLE_ORYX_BUILD=false`
