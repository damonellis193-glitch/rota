# Deployment Guide - Rota App Fix

## Issue Fixed
The app was getting stuck on the loading screen with the error:
```
Uncaught SyntaxError: Unexpected token 'class'
```

## Changes Made

### 1. HTML File (`index.html`)
**Changed:** Tailwind CSS loading method
- **Before:** `<script src="https://cdn.tailwindcss.com"></script>`
- **After:** `<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">`

**Why:** The Tailwind CSS CDN includes a JavaScript runtime that uses ES6 syntax (including the `class` keyword). This causes syntax errors in certain browser environments or when Google Apps Script serves the page in NATIVE sandbox mode.

**Solution:** Switched to a pre-built CSS-only version of Tailwind CSS that doesn't require JavaScript execution.

### 2. Google Apps Script File (`code.gs`)
**Changed:** Added sandbox mode configuration
- **Added:** `.setSandboxMode(HtmlService.SandboxMode.IFRAME)`

**Why:** IFRAME sandbox mode provides better support for modern JavaScript features and is the recommended mode for Google Apps Script web apps.

## How to Deploy

1. **Open your Google Apps Script project**
   - Go to https://script.google.com
   - Open your "Team Rota" project

2. **Update the `index.html` file**
   - Find line 5-6 in `index.html`
   - Replace the Tailwind CSS script tag with the new link tag (see changes above)

3. **Update the `code.gs` file**
   - Find the `doGet()` function
   - Add `.setSandboxMode(HtmlService.SandboxMode.IFRAME)` before `.setXFrameOptionsMode()`

4. **Deploy the updated version**
   - Click **Deploy** > **Manage deployments**
   - Click the **Edit** button (pencil icon) on your active deployment
   - Change the version to "New version"
   - Add a description like "Fixed ES6 syntax error"
   - Click **Deploy**

5. **Test the application**
   - Open the web app URL
   - The loading screen should now disappear and the app should load correctly
   - Verify that all Tailwind CSS styles are still applied correctly

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
