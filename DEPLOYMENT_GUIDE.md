# Deployment Guide - Rota App Fix

## Issue Fixed
The app was getting stuck on the loading screen with the error:
```
Uncaught SyntaxError: Failed to execute 'write' on 'Document': Unexpected token 'class'
```

## Root Cause
The `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)` setting was causing Google Apps Script to inject wrapper code that contains ES6 syntax. This injected code failed to execute using `document.write()`, preventing the app from loading.

## Changes Made

### Google Apps Script File (`code.gs`)
**Changed:** Removed the ALLOWALL XFrame setting

**Before:**
```javascript
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Team Rota & Holiday Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

**After:**
```javascript
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Team Rota & Holiday Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}
```

**Why:** The ALLOWALL setting was causing Google to inject problematic wrapper code. Removing it prevents the injection while still maintaining IFRAME sandbox mode for proper JavaScript support.

**Note:** The app will still work correctly. If you need to embed the app in an iframe on a specific domain in the future, you can use `HtmlService.XFrameOptionsMode.DEFAULT` instead of ALLOWALL.

## How to Deploy

1. **Open your Google Apps Script project**
   - Go to https://script.google.com
   - Open your "Team Rota" project

2. **Update the `code.gs` file**
   - Find the `doGet()` function (around line 9-16)
   - **Remove the line:** `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`
   - Make sure the function ends with `.setSandboxMode(HtmlService.SandboxMode.IFRAME);`

3. **Deploy the updated version**
   - Click **Deploy** > **Manage deployments**
   - Click the **Edit** button (pencil icon) on your active deployment
   - Change the version to "New version"
   - Add a description like "Fixed loading screen ES6 syntax error - removed ALLOWALL"
   - Click **Deploy**

4. **Test the application**
   - Open the web app URL
   - The loading screen should now disappear within 1-2 seconds
   - Verify that the app loads and functions correctly

## Verification

After deployment, you should:
- ✅ No longer see the "Unexpected token 'class'" error in the browser console
- ✅ The loading screen should disappear within a few seconds
- ✅ All UI elements should be properly styled
- ✅ The navigation should work correctly

## Rollback Plan

If you encounter any issues with the new deployment:

1. Go to **Deploy** > **Manage deployments**
2. Click **Edit** on your deployment
3. Change the version dropdown to select the previous working version
4. Click **Deploy**

## Additional Notes

- The pre-built Tailwind CSS (v2.2.19) includes all commonly used utility classes
- If you add new features that use Tailwind classes not available in v2.2.19, you may need to consider building a custom Tailwind CSS file or upgrading to v3
- The IFRAME sandbox mode is the recommended and default mode for modern Google Apps Script projects
