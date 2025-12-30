# Deployment Guide - Fixing "SPREADSHEET_ID not configured" Error

## The Problem

You're seeing this error:
```
Setup Required: SPREADSHEET_ID not configured. Please create a Google Sheet and update SPREADSHEET_ID in code.gs
```

Even though you believe you've set the correct Spreadsheet ID in your code.

## Root Cause

**The most common cause is that you saved the code but didn't create a NEW deployment.**

In Google Apps Script, simply saving the code in the editor does NOT update your live web app. You must explicitly create a new deployment for changes to take effect.

## Your Spreadsheet Details

Based on your URL: `https://docs.google.com/spreadsheets/d/1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM/edit?gid=1226422676#gid=1226422676`

Your Spreadsheet ID is: `1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM`

## Solution - Step by Step

### Step 1: Verify Your code.gs Configuration

1. Open your Apps Script project at [script.google.com](https://script.google.com)
2. Open the `code.gs` file
3. Check line 7 - it should look EXACTLY like this:

```javascript
const SPREADSHEET_ID = '1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM';
```

**NOT like this:**
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';  // ❌ WRONG!
```

4. Check line 8 - update with your actual email:

```javascript
const ADMIN_EMAILS = ['your.email@example.com'];  // Replace with your actual email
```

5. **Save the file** (Ctrl+S or Cmd+S)

### Step 2: Add the appsscript.json Manifest File

1. In the Apps Script editor, look for the gear icon ⚙️ on the left sidebar
2. Click it to access "Project Settings"
3. Check the box "Show 'appsscript.json' manifest file in editor"
4. Go back to the Editor (< > icon)
5. You should now see `appsscript.json` in the file list
6. Open it and replace all content with:

```json
{
  "timeZone": "Europe/London",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Gmail",
        "version": "v1",
        "serviceId": "gmail"
      }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/script.send_mail"
  ],
  "webapp": {
    "executeAs": "USER_ACCESSING",
    "access": "DOMAIN"
  }
}
```

7. **Save the file**

### Step 3: Create a NEW Deployment (CRITICAL!)

⚠️ **This is the step most people miss!**

1. Click **Deploy** button at the top right
2. Select **New deployment** (NOT "Manage deployments")
3. Click the gear icon ⚙️ next to "Select type"
4. Choose **Web app**
5. Fill in the form:
   - **Description**: "Version 2.0 - Fixed configuration" (or any description)
   - **Execute as**: **Me** (your email address)
   - **Who has access**: Select based on your needs:
     - "Only myself" - Private, only you can access
     - "Anyone with Google account" - Requires Google login
     - "Anyone within [your domain]" - For organization use
     - "Anyone" - Public access
6. Click **Deploy**
7. You may be asked to authorize the app - click "Authorize access"
8. **Copy the new Web App URL** - it ends with `/exec`

### Step 4: Use the NEW Deployment URL

⚠️ **Important**: Each deployment has its own URL!

- If you're using an old deployment URL, it won't have your changes
- Use the NEW URL you just copied
- Bookmark this URL for future use

### Step 5: Verify It Works

1. Open the new Web App URL in your browser
2. The app should load without the "SPREADSHEET_ID not configured" error
3. If you still see an error, try the diagnostic page: Add `?page=diagnostic` to the URL

Example: `https://script.google.com/macros/s/YOUR_ID/exec?page=diagnostic`

## Alternative: Update an Existing Deployment

If you want to keep the same URL:

1. Click **Deploy** → **Manage deployments**
2. Click the pencil/edit icon ✏️ next to your active deployment
3. At the top, click **Version** dropdown
4. Select **New version**
5. Click **Deploy**
6. Your existing URL will now point to the updated code

## Troubleshooting

### Still Getting "SPREADSHEET_ID not configured"?

**Check these:**
1. Did you create a NEW deployment (not just save)?
2. Are you using the NEW deployment URL?
3. Is the SPREADSHEET_ID line correct in code.gs?
4. Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Getting "Cannot access spreadsheet" Error?

**Check these:**
1. Open your Google Sheet directly
2. Click "Share" button
3. Make sure your email (the one deploying the app) has "Editor" access
4. The OAuth scopes in appsscript.json include spreadsheet access

### Getting Permission Errors?

1. Go to Apps Script editor
2. Click on any function (e.g., `checkSetup`)
3. Click **Run**
4. Authorize the app when prompted
5. Then create a new deployment

## Understanding Deployments

Think of deployments like published versions:

- **Saving code** = Saving a draft (not published)
- **Creating deployment** = Publishing the app (makes it live)
- **Old deployment URLs** = Old published versions (unchanged)
- **New deployment** = New published version (with your changes)

## Quick Reference

| Action | Result |
|--------|--------|
| Edit code.gs | Changes saved in editor only |
| Save file (Ctrl+S) | Changes saved in editor only |
| Create new deployment | Changes go LIVE with new URL |
| Update existing deployment | Changes go LIVE with same URL |
| Access old deployment URL | Shows OLD code (before changes) |

## Need More Help?

1. **Diagnostic Page**: Add `?page=diagnostic` to your web app URL
2. **Setup Guide**: Add `?page=setup` to your web app URL
3. **Check Logs**: In Apps Script editor, go to View → Logs
4. **Console**: Press F12 in your browser to see JavaScript errors

## Summary Checklist

Before asking for help, verify you've done ALL of these:

- [ ] Updated SPREADSHEET_ID in code.gs to actual ID (not placeholder)
- [ ] Updated ADMIN_EMAILS in code.gs with your email
- [ ] Saved the code.gs file
- [ ] Added/updated appsscript.json with proper OAuth scopes
- [ ] Created a NEW deployment (or updated existing one)
- [ ] Using the correct/new deployment URL (ends with /exec)
- [ ] Verified you have Editor access to the Google Sheet
- [ ] Authorized the app permissions when prompted
- [ ] Tried hard refresh or incognito mode

If you've done ALL of these and it still doesn't work, then we can investigate further!
