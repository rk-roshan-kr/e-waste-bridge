# E-Waste Bridge: Production Deployment & Infrastructure Guide
**Problem Statement 2: E-Waste Management & Informal Sector Formalization**
*Target Environment: Entry-Level Android (Android Go), Edge Kiosks, Cloud CDN & Container Runtimes*

---

## 1. Architecture Overview

E-Waste Bridge is architected as an **Offline-First Progressive Web Application (PWA)** optimized for:
1. **Low-Memory Devices**: Operates within a strictly budgeted **<35 MB V8 heap** footprint on entry-level Android devices (e.g., 2 GB RAM Android Go edition).
2. **Intermittent Connectivity**: Full functionality (Lot Creation, Camera OCR, Voice Intent Parsing, Offline Ledger, LocalStorage/IndexedDB persistence) operates with **zero cellular/Wi-Fi signal**.
3. **Multi-Platform Deployment**: Deployable to any standard static edge CDN (Vercel, Netlify, Cloudflare Pages), container cluster (Docker, Kubernetes, AWS ECS, GCP Cloud Run), or bare-metal Linux server with Nginx.

```
+-------------------------------------------------------------------------------+
|                             CLIENT APPLICATION                                |
|  [Android Phone / Chrome PWA / Desktop Kiosk / Dharavi Scrap Consolidation]   |
+---------------------------------------+---------------------------------------+
                                        |
                 +----------------------+----------------------+
                 | Service Worker (sw.js)                     |
                 | - Cache-First: JS, CSS, Media (Immutable)   |
                 | - Stale-While-Revalidate: Datasets, Prices  |
                 | - Offline Fallback: /index.html             |
                 +----------------------+----------------------+
                                        |
                 +----------------------+----------------------+
                 | Local Storage & IndexedDB (Browser Sandbox)  |
                 | - Active Lots, Pending Dues, Handover GPS   |
                 | - Sync Queue, Speech Correction Memory      |
                 +---------------------------------------------+
                                        |
                         (When Network is Available)
                                        |
+---------------------------------------v---------------------------------------+
|                       EDGE REVERSE PROXY & HOSTING                           |
|  [Nginx Alpine Docker Container / Vercel Edge / Netlify CDN / Kiosk Pi]      |
|  - HTTP/2 & Gzip/Brotli Static Compression                                   |
|  - Permissions-Policy: microphone=(self), camera=(self), geolocation=(self)   |
|  - Strict Cache-Control: sw.js (no-cache) vs assets/* (1y immutable)         |
+-------------------------------------------------------------------------------+
```

---

## 2. One-Click Container Deployment (Docker & Docker Compose)

The repository provides a production multi-stage `Dockerfile` and `docker-compose.yml`.

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.20+

### Option A: Using Docker Compose (Recommended)
```bash
# 1. Clone or navigate to the workspace
cd "d:\SIH prototype ps2"

# 2. Build the production image and run in detached mode
docker compose up -d --build

# 3. Check container status & health
docker compose ps
docker compose logs -f
```

The container automatically exposes **Port 80** and initiates internal healthchecks via `GET /healthz`.

### Option B: Standalone Docker CLI
```bash
# Build the production image
docker build -t ewaste-bridge:latest .

# Run with resource limits suited for edge hardware (256MB RAM limit)
docker run -d \
  --name ewaste-bridge-app \
  -p 80:80 \
  --memory="256m" \
  --cpus="1.0" \
  --restart unless-stopped \
  ewaste-bridge:latest

# Verify health endpoint
curl -I http://localhost/healthz
# Returns: HTTP/1.1 200 OK
```

---

## 3. Cloud Edge CDN Deployments

### A. Vercel
The repository includes a production-tuned `vercel.json` with optimized caching policies and SPA rewrites.

1. Install the Vercel CLI (or link via GitHub repo in Vercel Dashboard):
   ```bash
   npm i -g vercel
   ```
2. Deploy to staging:
   ```bash
   vercel
   ```
3. Deploy directly to production:
   ```bash
   vercel --prod
   ```
*Note: Vercel automatically applies the headers in `vercel.json`, guaranteeing that `sw.js` is never cached while `/assets/*` receives `max-age=31536000, immutable`.*

### B. Netlify
The repository includes `netlify.toml` and `public/_redirects`.

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```
2. Build and deploy:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

---

## 4. Bare-Metal Linux / Ubuntu Nginx Server

For hosting on dedicated VPS instances (e.g., AWS EC2, DigitalOcean Droplet, Linode):

1. **Install Nginx and certbot**:
   ```bash
   sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
   ```
2. **Build the production assets**:
   ```bash
   npm ci
   npm run build
   ```
3. **Deploy the bundle**:
   ```bash
   sudo rm -rf /var/www/ewaste-bridge/*
   sudo cp -r dist/* /var/www/ewaste-bridge/
   ```
4. **Copy the Nginx configuration**:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/ewaste-bridge
   # Edit server_name to your registered domain (e.g., ewaste.gov.in)
   sudo ln -s /etc/nginx/sites-available/ewaste-bridge /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
5. **Issue HTTPS Certificate via Let's Encrypt**:
   ```bash
   sudo certbot --nginx -d ewaste.yourdomain.org
   ```
   > **CRITICAL**: Web Speech API and Microphone/Camera access in modern browsers require HTTPS (`navigator.mediaDevices.getUserMedia` is restricted to secure contexts `https://` or `http://localhost`). Always enable SSL on public deployments.

---

## 5. Offline Edge Kiosk / Scrap Yard Micro-Server (Raspberry Pi 4 / 5)

For decentralized scrap consolidation hubs (e.g., Kurla / Dharavi scrap yards) where external 4G/5G signals are jammed or unreliable:

1. **Setup Raspberry Pi OS (64-bit)** with Docker installed.
2. Clone repository to `/opt/ewaste-bridge`.
3. Configure local Wi-Fi Hotspot on the Pi using `hostapd` / `dnsmasq` (e.g., SSID: `EWasteBridge-Hub`, Captive Portal pointing `*.local` to `192.168.4.1`).
4. Run container:
   ```bash
   docker compose up -d
   ```
5. Collectors connecting to the local Wi-Fi hotspot access `http://192.168.4.1/` without internet access. The Service Worker caches the app permanently on their phones after the first load.

---

## 6. Android Progressive Web App (PWA) Installation

1. Open the deployed application URL in Chrome / Samsung Internet on any Android smartphone.
2. Tap the browser options menu (3 dots) -> Tap **"Install app"** or **"Add to Home screen"**.
3. Confirm installation. The application installs as a standalone APK-like experience with:
   - Dedicated launcher icon (`/favicon.svg` and `/icons.svg`)
   - Native portrait orientation lock (`portrait-primary`)
   - Translucent status bar integration (`#0B0E14`)
   - Instant cold-start from disk via Service Worker cache in under **350 milliseconds**.

---

## 7. Environment Variables Reference

Copy `.env.example` to `.env` if custom build-time overrides are required:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Vite compilation mode |
| `VITE_API_URL` | `""` | Backend API gateway endpoint (empty for local IndexedDB mode) |
| `VITE_DEFAULT_LANGUAGE` | `hi` | Initial vernacular language code (`hi`, `mr`, `en`) |
| `VITE_APP_NAME` | `"E-Waste Bridge"` | Branding header name |
| `VITE_TELEMETRY_SYNC_INTERVAL_MS` | `30000` | Background sync cadence for audit queue |
| `VITE_HIGH_VALUE_THRESHOLD_INR` | `100000` | Statutory hold-to-confirm threshold (₹1,00,000) |
| `VITE_HOLD_GATE_DURATION_MS` | `5000` | Physical touch hold duration (5,000 ms) |

---

## 8. Verification & Pre-Flight Testing

Before promoting any release to production, execute the integrated verification suite:

```bash
# 1. Verify relational dataset schemas, constraints, and PS2 material taxonomy
node scratch/test_dataset_flow.js

# 2. Verify voice normalizer, language detection, hold-gates, and turn management
node scratch/test_modular_runtime.js

# 3. Combined test runner
npm test

# 4. Production build bundle validation
npm run build
```

Expected Output:
```
===============================================================
TOTAL TESTS: 52 | PASSED: 52 | FAILED: 0
===============================================================
TOTAL TESTS: 41 | PASSED: 41 | FAILED: 0
===============================================================
[PASS] 2333 modules transformed.
[PASS] built in ~330ms
```

---

## 9. Rollback & Disaster Recovery

If a faulty build is accidentally deployed:
1. Re-run `npm run seed` to reset local test datasets to canonical CPCB state:
   ```bash
   npm run seed
   ```
2. In Docker:
   ```bash
   docker compose down
   docker compose up -d --build
   ```
3. PWA Cache Invalidation: Increment `CACHE_NAME` in `public/sw.js` (e.g. from `'ewaste-bridge-v2'` to `'ewaste-bridge-v3'`). The Service Worker's `activate` event automatically purges all stale caches upon client refresh.
