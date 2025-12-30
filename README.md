# rota

## ✅ FIXED: Loading Screen Issue (Updated Dec 30, 2024)

This repository contains a Google Apps Script web application for team holiday/rota management.

### 🚨 Latest Fix - Loading Screen Still Stuck
**Issue:** App gets stuck on loading screen with error: 
```
Uncaught SyntaxError: Failed to execute 'write' on 'Document': Unexpected token 'class'
```

**Root Cause:** The `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)` setting in `code.gs` was causing Google to inject problematic wrapper code.

**Solution:** Remove the ALLOWALL XFrame setting from the `doGet()` function.

### 📚 Documentation
- 📖 **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Full explanation of the issue and fix
- 📋 **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
- ✅ **[FIX_SUMMARY.md](FIX_SUMMARY.md)** - Technical summary of the fix

### Quick Fix (Do This Now!)

1. Open your Google Apps Script project at https://script.google.com
2. Edit `code.gs` and find the `doGet()` function
3. **Remove this line:** `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`
4. Deploy a new version (Deploy → Manage deployments → Edit → New version)
5. Test your app - the loading screen should now complete!

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

### Files in This Repository
- `index.html` - Main web application UI
- `code.gs` - Google Apps Script backend code
- `TROUBLESHOOTING.md` - Comprehensive troubleshooting guide ⭐ **START HERE**
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment instructions
- `FIX_SUMMARY.md` - Technical summary of the fix