# Azure Runtime Fix: Module Not Found Error

## Problem
```
ERROR: Cannot find module '/home/site/wwwroot/standalone/server.js'
```

Azure is running `node standalone/server.js` but the deployment artifact places `server.js` at the root: `/home/site/wwwroot/server.js`

---

## Root Cause
Azure App Service startup command is still set to the old value:
```
node standalone/server.js
```

Should be:
```
node server.js
```

---

## Solution: Azure Portal (Manual)

### Step 1: Update Startup Command via Azure Portal

1. **Open Azure Portal** → `catalyst-ai-mayank` app service
2. Navigate to: **Configuration** → **General settings**
3. Find the **Startup Command** field
4. Clear any existing value
5. Enter exactly:
   ```
   node server.js
   ```
6. **Save** (blue Save button at top)
7. **Restart** the app service (Overview → Restart button)

Wait 30 seconds for restart to complete.

### Step 2: Verify in Azure Portal

Go to: **Log stream** or **Diagnose and solve problems** → Recent app logs

Expected output:
```
node server.js
Server listening on port 8080
```

OR (if compatibility wrapper is deployed):
```
node standalone/server.js
  → require("../server.js")
Server listening on port 8080
```

Should NOT show:
```
Cannot find module '/home/site/wwwroot/standalone/server.js'
```

---

## Solution: Azure CLI (Automated)

If you have Azure CLI installed, run:

```bash
# Set startup command
az webapp config set \
  --resource-group <YOUR_RESOURCE_GROUP> \
  --name catalyst-ai-mayank \
  --startup-file "node server.js"

# Restart app
az webapp restart \
  --resource-group <YOUR_RESOURCE_GROUP> \
  --name catalyst-ai-mayank
```

Replace `<YOUR_RESOURCE_GROUP>` with your actual resource group (e.g., `default` or `catalyst-rg`).

---

## Verify Deployment Artifact via Kudu

### Step 1: Open Kudu Console

Navigate to: `https://catalyst-ai-mayank.scm.azurewebsites.net/DebugConsole`

### Step 2: Check File Structure

```bash
cd /home/site/wwwroot
ls -la
```

Expected output:
```
total 520
-rw-r--r--  1 root root     1234 May 10 12:34 server.js
-rw-r--r--  1 root root      892 May 10 12:34 package.json
drwxr-xr-x  2 root root     4096 May 10 12:34 .next
drwxr-xr-x  2 root root     4096 May 10 12:34 public
drwxr-xr-x 123 root root  32768 May 10 12:34 node_modules
```

### Step 3: Verify server.js Exists at Root

```bash
test -f /home/site/wwwroot/server.js && echo "✓ server.js found at root" || echo "✗ MISSING"
```

Expected: `✓ server.js found at root`

### Step 4: Verify Compatibility Wrapper Exists

```bash
test -f /home/site/wwwroot/standalone/server.js && echo "✓ Wrapper exists" || echo "✗ Wrapper missing"
```

Expected: `✓ Wrapper exists`

### Step 5: Check No Old Artifacts

```bash
# Should be empty if artifact is clean
test -d /home/site/wwwroot/standalone && ls -la /home/site/wwwroot/standalone
```

Expected: Just the small wrapper file we created, not old deployment files.

---

## If Artifact is Stale

If Kudu shows old/broken files:

### Option A: Clean via Kudu Console

```bash
cd /home/site/wwwroot
rm -rf *
```

Then trigger new deployment:
- **GitHub** → **Actions** → **Deploy to Azure App Service** → **Run workflow**

Wait for completion, then restart app service.

### Option B: Force Redeploy via GitHub Actions

1. Go to: **GitHub repo** → **Actions** → **Deploy to Azure App Service**
2. Click **Run workflow** (manual trigger)
3. Wait for job to complete (5-10 minutes)
4. Go to Azure Portal → **catalyst-ai-mayank** → **Restart**

---

## Verify GitHub Workflow is Correct

Check: [.github/workflows/deploy-azure-app-service.yml](.github/workflows/deploy-azure-app-service.yml)

Should include:

1. **Build standalone:**
   ```yaml
   - name: Build (standalone)
     run: npm run build
   ```

2. **Package artifact:**
   ```bash
   rm -rf deploy && mkdir -p deploy
   cp -R .next/standalone/. deploy/
   cp -R .next/static/. deploy/.next/static/
   ```

3. **Verify output:**
   ```bash
   test -f deploy/server.js
   ```

4. **Add compatibility wrapper:**
   ```bash
   mkdir -p deploy/standalone
   cat > deploy/standalone/server.js <<'EOF'
   require("../server.js");
   EOF
   ```

5. **Deploy:**
   ```yaml
   - name: Deploy to Azure App Service
     uses: azure/webapps-deploy@v3
     with:
       app-name: catalyst-ai-mayank
       publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
       package: ./deploy
   ```

---

## Verify App Settings

In Azure Portal → **Configuration** → **Application settings**, ensure these are set:

| Key | Value | Required |
|-----|-------|----------|
| `NODE_ENV` | `production` | ✓ |
| `PORT` | `8080` | ✓ |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~22` | ✓ |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` | ✓ |
| `ENABLE_ORYX_BUILD` | `false` | ✓ |

**CRITICAL**: Verify `DATABASE_URL` is a **cloud database** (Neon, Azure Database for PostgreSQL), NOT `localhost`.

```bash
# WRONG (will fail in Azure)
DATABASE_URL=postgresql://localhost:5432/catprep

# CORRECT (cloud Postgres)
DATABASE_URL=postgresql://user:pass@db.neon.tech:5432/catprep?sslmode=require
```

---

## Test After Fix

### Via Azure Portal Logs

**App Service** → **Log stream**

Should show:
```
node server.js
Server listening on port 8080
```

NOT:
```
Cannot find module '/home/site/wwwroot/standalone/server.js'
```

### Via HTTP

```bash
# Test home page
curl https://catalyst-ai-mayank.azurewebsites.net/

# Test health endpoint
curl https://catalyst-ai-mayank.azurewebsites.net/api/health
```

Expected: HTML page + `{"ok": true}` or similar healthy response

---

## Troubleshooting Checklist

- [ ] Startup command set to `node server.js` (not `node standalone/server.js`)
- [ ] App service restarted after changing startup command
- [ ] Kudu shows `server.js` at `/home/site/wwwroot/server.js`
- [ ] No `Cannot find module` error in logs
- [ ] `NODE_ENV=production` is set
- [ ] `PORT=8080` is set
- [ ] `DATABASE_URL` points to cloud database (not localhost)
- [ ] GitHub Actions workflow completed successfully
- [ ] Compatibility wrapper exists at `deploy/standalone/server.js`

---

## Expected Final State

### Azure Log Stream
```
node server.js
Server listening on port 8080
GET /api/health 200 45ms
```

### Browser
```
https://catalyst-ai-mayank.azurewebsites.net/ → Home page loads
https://catalyst-ai-mayank.azurewebsites.net/api/health → {"ok": true}
```

### No Application Error

App Service overview should show **green** status, not error.

---

## Notes

- **Compatibility wrapper** allows both startup commands to work
- **Recommended:** Update Azure startup command to `node server.js` for clarity
- **Long-term:** Remove compatibility wrapper once Azure command is confirmed working
- **Deployment**: Always trigger via GitHub Actions, never manually upload to Kudu
