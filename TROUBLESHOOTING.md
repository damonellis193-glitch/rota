# Troubleshooting: Loading Screen Error

## The Issue You Experienced

When opening your Rota app, you saw:
- A persistent loading screen that never completed
- Console errors including:
  ```
  Uncaught SyntaxError: Failed to execute 'write' on 'Document': Unexpected token 'class'
  ```
- Multiple warnings about unrecognized features: 'ambient-light-sensor', 'speaker', 'vibrate', 'vr'
- Errors from Google's internal JavaScript file (`mae_html_user_bin_i18n_mae_html_user__en_gb.js`)

## What Caused This

The problem was caused by a single line in your `code.gs` file:
```javascript
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
```

This setting tells Google Apps Script to allow your app to be embedded in iframes from **any** website. While this sounds useful, it has an unintended side effect:

1. Google Apps Script injects special wrapper code when ALLOWALL is enabled
2. This wrapper code contains modern JavaScript (ES6) syntax, including the `class` keyword
3. The wrapper tries to inject this code using the old `document.write()` method
4. The browser rejects this because `document.write()` cannot safely execute modern JavaScript in certain contexts
5. This causes a syntax error that prevents your app from loading

## The Fix

We removed the problematic line from your `doGet()` function in `code.gs`:

**Before:**
```javascript
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Team Rota & Holiday Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);  // ← REMOVED THIS LINE
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

## Why This Fixes It

By removing the ALLOWALL setting:
- Google Apps Script no longer injects the problematic wrapper code
- Your app loads directly without the ES6 syntax error
- The loading screen completes successfully
- All functionality remains intact

## What You Need to Do Now

1. **Open your Google Apps Script project:**
   - Go to https://script.google.com
   - Open your "Team Rota" project

2. **Edit the `code.gs` file:**
   - Find the `doGet()` function (around line 9-16)
   - Remove this line: `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`
   - Save the file (Ctrl+S or Cmd+S)

3. **Deploy the change:**
   - Click **Deploy** → **Manage deployments**
   - Click the **Edit** button (pencil icon) next to your active deployment
   - Change "Version" to **"New version"**
   - Add a description: "Fixed loading screen error - removed ALLOWALL setting"
   - Click **Deploy**
   - Copy the new Web app URL if it changed

4. **Test it:**
   - Open your web app URL
   - The loading screen should disappear within 1-2 seconds
   - Verify the app works correctly

## Will This Break Anything?

**No!** Your app will work exactly the same. The only thing that changes is:

- ✅ Your app will load correctly
- ✅ All features continue to work
- ✅ All styling remains the same
- ⚠️ The app can only be embedded on Google domains (this is actually more secure)

If you specifically need to embed the app in an iframe on another website, you can use `HtmlService.XFrameOptionsMode.DEFAULT` instead, which allows Google domains only.

## Understanding the Console Warnings

The warnings about "Unrecognized feature" are normal and harmless:
```
Unrecognized feature: 'ambient-light-sensor'
Unrecognized feature: 'speaker'
Unrecognized feature: 'vibrate'
Unrecognized feature: 'vr'
```

These are just browser warnings about iframe permissions that aren't needed for your app. They don't affect functionality and will disappear once the main error is fixed.

## If It Still Doesn't Work

If you still see the loading screen after deploying:

1. **Clear your browser cache:**
   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Select "Cached images and files"
   - Clear the cache

2. **Try incognito/private mode:**
   - Open a new incognito window
   - Navigate to your web app URL
   - This tests without any cached data

3. **Check the browser console:**
   - Press F12 to open Developer Tools
   - Click the "Console" tab
   - Look for any remaining errors
   - Share these errors if you need more help

## Technical Background (Optional Reading)

This issue is a known problem with Google Apps Script when combining:
- IFRAME sandbox mode (needed for modern JavaScript)
- ALLOWALL XFrame options (allows embedding anywhere)
- Modern ES6 JavaScript in injected code
- The `document.write()` method (legacy technique)

Google's wrapper code tries to use `document.write()` to inject ES6 code, but browsers prevent this for security reasons. The solution is to avoid triggering the wrapper code injection by not using ALLOWALL.

## Related Issues

This is not the same as the previous Tailwind CSS issue, though it has similar symptoms. The Tailwind CSS fix (switching to CSS-only version) is still in place and working correctly. This is a separate, additional issue that needed to be fixed.
