# Critical: Complete Deployment Instructions

## 🚨 If You're Still Seeing the Loading Screen Error

Follow these steps **EXACTLY** to deploy the fixed version:

### Step 1: Verify Your Code Files

1. Go to https://script.google.com
2. Open your "Team Rota" project
3. Click on `code.gs` file
4. **Verify** that your `doGet()` function looks **EXACTLY** like this (around line 9-15):

```javascript
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Team Rota & Holiday Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}
```

**CRITICAL:** There should be NO `.setXFrameOptionsMode()` line!

If you see `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`, DELETE that entire line.

**Note:** Your actual `doGet()` function should look like this (with the `e` parameter for URL parameters):

```javascript
function doGet(e) {
  // Diagnostic mode: add ?page=diagnostic to URL
  if (e && e.parameter && e.parameter.page === 'diagnostic') {
    return HtmlService.createHtmlOutputFromFile('diagnostic')
      .setTitle('Rota Diagnostics')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  }
  
  // Normal app
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Team Rota & Holiday Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}
```

### Step 2: Update the HTML File

1. In Google Apps Script, click on `index.html`
2. Replace the ENTIRE contents with the updated version from this repository
3. Save (Ctrl+S or Cmd+S)

### Step 3: Deploy a NEW Version (Most Important!)

**This is the step most people miss!**

1. In Google Apps Script, click **Deploy** button (top right)
2. Click **Manage deployments**
3. Click the **pencil/edit icon** next to your active deployment
4. In the "Version" dropdown, select **"New version"**
5. Add a description: "Fixed loading screen error - v2"
6. Click **Deploy**
7. **COPY** the new Web app URL (it should be the same, but copy it anyway)
8. Click **Done**

### Step 4: Clear Your Browser Cache

**This is critical!** Old code might be cached.

#### Option A: Hard Refresh (Try this first)
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`
- This forces the browser to reload everything fresh

#### Option B: Clear Cache Completely
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Time range: "Last hour" or "Last 24 hours"
4. Click "Clear data"

### Step 5: Test in Incognito/Private Mode

1. Open a new **Incognito/Private browsing window**:
   - Chrome: `Ctrl + Shift + N` (Windows) or `Cmd + Shift + N` (Mac)
   - Firefox: `Ctrl + Shift + P` (Windows) or `Cmd + Shift + P` (Mac)
   - Edge: `Ctrl + Shift + N` (Windows)

2. Paste your Web app URL
3. The app should load within 1-2 seconds

### Step 6: Verify It's Working

Open the browser console (F12) and check for these messages:

✅ **Good signs:**
```
[Rota App] Script started loading...
[Rota App] Google Apps Script detected
[Rota App] Window loaded, calling getInitialData...
[Rota App] Data loaded successfully: {...}
[Rota App] Hiding loading screen
[Rota App] Showing dashboard for user: [Your Name]
[Rota App] Initialization complete
```

❌ **Bad signs:**
```
Uncaught SyntaxError: Failed to execute 'write' on 'Document'
Unrecognized feature: 'ambient-light-sensor'
```

If you see the bad signs, you haven't deployed correctly. Go back to Step 3.

## 🔍 Troubleshooting

### "I followed all steps but still see the loading screen"

1. **Check you deployed a NEW version** (not just "Saved" the files)
   - Saving != Deploying
   - You MUST create a new deployment version

2. **Check the URL you're using**
   - Make sure you're using the Web app URL from the deployment
   - NOT the script editor URL (script.google.com/...)

3. **Try a different browser**
   - Sometimes browser extensions cause issues
   - Try Chrome, Firefox, or Edge

4. **Check you have permissions**
   - The spreadsheet ID in `code.gs` must be correct
   - You must have edit access to that spreadsheet

### "I see 'Access Denied' or 'Guest' user"

This means you're not in the Employees sheet:

1. Open the spreadsheet (ID in `code.gs` line 6)
2. Go to the "Employees" tab
3. Add a row with your email address

### "The loading screen disappears but page is blank"

Check the browser console (F12) for specific errors and report them.

## 📝 What Changed?

The fix includes:

1. **Removed** `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)` from code.gs
   - This was causing Google to inject problematic wrapper code
   
2. **Added** better error logging and debugging
   - Console messages help diagnose issues
   
3. **Improved** compatibility
   - Changed `let` to `var` for broader compatibility
   - Added try-catch blocks
   
4. **Enhanced** error messages
   - More helpful alerts when things go wrong

## ✅ Expected Behavior After Fix

- Loading screen appears for 1-2 seconds
- Dashboard loads and shows your holiday information
- No errors in the browser console
- All features work normally

## 🆘 Still Having Issues?

If you've followed ALL steps above and still have issues:

### Use the Diagnostic Page

Add `?page=diagnostic` to your web app URL:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?page=diagnostic
```

This will run automated tests and tell you exactly what's wrong.

### Or Manual Debugging:

1. Open browser console (F12)
2. Screenshot any error messages
3. Provide the exact steps you followed
4. Share what you see (loading screen, blank page, etc.)

The issue is almost certainly one of:
- Not deploying a new version (most common!)
- Browser cache (use incognito mode!)
- Wrong URL (use deployment URL, not editor URL)
- Permissions issue (check spreadsheet access)
