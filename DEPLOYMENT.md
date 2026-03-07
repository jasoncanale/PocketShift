# PocketShift Deployment Guide

This guide covers deploying PocketShift to Vercel and packaging it as an APK with PWA Builder.

---

## Prerequisites

- [Vercel account](https://vercel.com)
- [Supabase project](https://supabase.com) (for auth and database)
- PocketShift repo pushed to GitHub/GitLab/Bitbucket

---

## 1. Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your PocketShift repository
3. Configure environment variables (see below)
4. Click **Deploy**

### Option B: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts, then add environment variables in the dashboard.

### Environment Variables

Add these in **Vercel → Project → Settings → Environment Variables**:

| Variable                        | Description                   | Required |
| ------------------------------- | ----------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL     | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes      |

Copy values from **Supabase → Project Settings → API**.

### Post-Deploy

- Your app will be live at `https://your-project.vercel.app`
- For a custom domain: **Vercel → Project → Settings → Domains**

---

## 2. Package as APK with PWA Builder

Once deployed and accessible over HTTPS:

1. Go to **[pwabuilder.com](https://www.pwabuilder.com/)**
2. Enter your app URL (e.g. `https://pocketshift.vercel.app`)
3. Click **Start**
4. PWA Builder will validate your manifest and service worker
5. Click **Package for stores** → **Android**
6. Fill in:
   - **Package ID:** `com.0rsino.pocketshift`
   - **App name:** PocketShift
   - **Signing key:** Create new (or use existing keystore)
7. Click **Generate**
8. Download the APK (or AAB for Google Play)

### Install the APK

- Transfer the APK to your Android device and open it to install
- Or use `adb install pocketshift.apk` if you have Android SDK tools

---

## 3. PWA Checklist (Pre-Deploy)

PocketShift is already configured with:

- ✅ `manifest.json` – name, icons (192×192, 512×512), start_url, display
- ✅ Service worker (`/sw.js`) – offline caching
- ✅ Icons at `/icons/icon-192.png` and `/icons/icon-512.png`
- ✅ Manifest link in layout
- ✅ Vercel headers for manifest and service worker
- ✅ OTA update prompt (Refresh when new version is deployed)

---

## 4. Troubleshooting

### Build fails on Vercel

- Ensure all env vars are set
- Check **Vercel → Deployments → [latest] → Build Logs**

### PWA Builder reports low score

- Deploy first – PWA Builder needs a live HTTPS URL
- Verify `https://your-domain.com/manifest.json` loads
- Verify `https://your-domain.com/icons/icon-512.png` loads

### App doesn’t work offline

- The service worker caches static assets and navigation
- API calls (Supabase) require network; Dexie provides local fallback for some data

---

## 5. Over-the-Air (OTA) Updates

PocketShift supports OTA updates for the PWA and APK:

- **Update check:** Runs when the app loads and when the user returns to the tab (visibility change)
- **Update prompt:** When a new version is deployed, users see an "Update available" banner with a **Refresh** button
- **No reinstall needed:** Users tap Refresh to load the latest version; no app store update required

To ship an update: deploy to Vercel as usual. Users will see the prompt on their next visit (or when they switch back to the app).
