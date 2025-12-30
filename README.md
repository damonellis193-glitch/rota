# rota

## ✅ FIXED: Loading Screen Issue (Updated Dec 30, 2024)

This repository contains a Google Apps Script web application for team holiday/rota management.

### 🚨 Are You Still Seeing the Loading Screen Error?

**READ THIS FIRST:** [**DEPLOYMENT_INSTRUCTIONS.md**](DEPLOYMENT_INSTRUCTIONS.md) ⭐

This file has **complete step-by-step instructions** to fix the loading screen issue.

**Quick Diagnostic:** Add `?page=diagnostic` to your web app URL to run automated tests.

### Common Issue: Not Deploying Correctly

⚠️ **Most Common Mistake:** Saving the files but not deploying a NEW version!

**Saving ≠ Deploying**

You MUST:
1. Edit the files in Google Apps Script
2. **Deploy** → **Manage deployments** → Edit → **New version**
3. Clear browser cache or use incognito mode

See [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md) for detailed steps.

---

### 📚 Additional Documentation
- 📖 **[DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md)** - ⭐ START HERE if you have loading issues
- 📋 **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Original deployment guide
- ✅ **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Technical troubleshooting
- 📝 **[FIX_SUMMARY.md](FIX_SUMMARY.md)** - Technical summary of the fix

### Files in This Repository
- `index.html` - Main web application UI (with debug logging)
- `code.gs` - Google Apps Script backend code (with diagnostic mode)
- `diagnostic.html` - Diagnostic page for troubleshooting
- Documentation files (see above)

### What Was Fixed

1. **Removed problematic code:** `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`
2. **Added debug logging:** Console messages help identify issues
3. **Improved compatibility:** Better error handling and initialization
4. **Created diagnostic tools:** Automated testing page

### ⚡ Quick Start (New Deployment)

1. Open https://script.google.com
2. Copy `code.gs` and `index.html` into your project
3. Update `SPREADSHEET_ID` and `ADMIN_EMAILS` in code.gs
4. Deploy → New deployment → Web app
5. Access your web app URL

For existing deployments with issues, see [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md).