# rota

## ✅ FIXED: Loading Screen Issue

This repository contains a Google Apps Script web application for team holiday/rota management.

### Recent Fix (Dec 30, 2024)
**Issue:** App was getting stuck on loading screen with error: `Uncaught SyntaxError: Unexpected token 'class'`

**Solution:** Replaced JavaScript-based Tailwind CSS CDN with CSS-only version for compatibility.

📖 **See [FIX_SUMMARY.md](FIX_SUMMARY.md)** for details about the fix  
📋 **See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for deployment instructions

### Quick Start
1. Deploy the changes to your Google Apps Script (see DEPLOYMENT_GUIDE.md)
2. Open your web app URL
3. The app should now load without errors

### Files in This Repository
- `index.html` - Main web application UI
- `code.gs` - Google Apps Script backend code
- `FIX_SUMMARY.md` - Explanation of the loading screen fix
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment instructions