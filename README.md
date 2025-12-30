# Team Rota - Holiday Manager

A comprehensive team holiday and absence management system built for Google Apps Script.

## Features

- ✅ Holiday booking and approvals
- ✅ Team calendar visualization
- ✅ Admin panel with pending requests
- ✅ Sickness tracking & Bradford factor
- ✅ Work pattern management
- ✅ Email notifications
- ✅ Audit logs
- ✅ Manager hierarchy
- ✅ Department filtering
- ✅ Multi-month views
- ✅ Mobile responsive

## Quick Start

### Easy Setup

1. **Access the Setup Guide**: After deploying the app, visit `YOUR_WEB_APP_URL?page=setup` for step-by-step instructions.

### Manual Setup

### 1. Setup Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy the contents of `code.gs` to the Code.gs file
4. Create HTML files:
   - `index.html` - Copy from this repository
   - `diagnostic.html` - Copy from this repository
   - `setup.html` - Copy from this repository (for setup guide)
5. Copy the contents of `appsscript.json` to the Project Settings:
   - Click the gear icon (⚙️) on the left sidebar
   - Scroll down to "Script Properties"
   - Or use the "< >" icon to edit manifest file directly

### 2. Configure Spreadsheet

1. Create a new Google Sheet
2. Copy the **Spreadsheet ID** from the URL:
   - Example URL: `https://docs.google.com/spreadsheets/d/1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM/edit`
   - Spreadsheet ID is: `1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM` (the part between `/d/` and `/edit`)
3. In `code.gs`, update line 7:
   - Change: `const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';`
   - To: `const SPREADSHEET_ID = '1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM';`
4. In `code.gs`, update line 8:
   - Change: `const ADMIN_EMAILS = ['your_email@domain.com'];`
   - To: `const ADMIN_EMAILS = ['youremail@example.com'];` (use your actual email)
5. **Save the file** (Ctrl+S or Cmd+S)

### 3. Deploy

⚠️ **IMPORTANT**: Simply saving the code is NOT enough. You must create a NEW deployment for changes to take effect.

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select type: **Web app**
4. Set configuration:
   - **Description**: Version 1.0 (or increment version number)
   - **Execute as**: **Me** (your email)
   - **Who has access**: Choose based on your needs:
     - **Only myself** - Only you can access
     - **Anyone** - Public access
     - **Anyone with Google account** - Requires Google login
     - **Anyone within [your domain]** - Organization only
5. Click **Deploy**
6. **Authorize the app** when prompted (first time only)
7. Copy the **Web App URL** (ends with `/exec`)

**Updating After Code Changes:**
- After making changes to `code.gs`, you MUST create a **New deployment**
- Simply saving the file will NOT update the live web app
- Each new deployment gets a unique URL OR you can update an existing deployment

### 4. First Run

1. Open the Web App URL
2. Grant necessary permissions
3. The app will automatically create required sheets
4. Add employees via the Admin panel

## Files

- `code.gs` - Backend Google Apps Script code
- `index.html` - Main application UI
- `diagnostic.html` - Diagnostic testing page
- `setup.html` - Step-by-step setup guide
- `appsscript.json` - Apps Script project manifest (OAuth scopes, timezone, etc.)
- `README.md` - This file

## Troubleshooting

### "SPREADSHEET_ID not configured" Error

This error means the app is still using the default placeholder values. Common causes:

1. **You updated the code but didn't deploy it**
   - Solution: Create a **New deployment** (Deploy → New deployment)
   - Saving the file alone does NOT update the live app
   
2. **You're using an old deployment URL**
   - Solution: Use the URL from your latest deployment
   - Or update an existing deployment: Deploy → Manage deployments → Edit → Deploy

3. **SPREADSHEET_ID is still the placeholder**
   - In `code.gs`, line 7 should look like:
     ```javascript
     const SPREADSHEET_ID = '1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM'; // Your actual ID
     ```
   - NOT:
     ```javascript
     const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Wrong!
     ```

### Permission Errors

If you get "Cannot access spreadsheet" errors:

1. **Check spreadsheet permissions**: 
   - Open the Google Sheet
   - Ensure the account deploying the app has **Editor** access
   - Check: File → Share → Your email should have "Editor" role

2. **Check OAuth scopes**:
   - The `appsscript.json` file should include:
     ```json
     "oauthScopes": [
       "https://www.googleapis.com/auth/spreadsheets",
       "https://www.googleapis.com/auth/userinfo.email",
       "https://www.googleapis.com/auth/script.send_mail"
     ]
     ```
   - If you added this file, create a new deployment for it to take effect

3. **Re-authorize the app**:
   - Go to Apps Script editor
   - Run any function (e.g., `checkSetup`)
   - Grant permissions when prompted

### App not loading?

1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Make sure you're using the Web App URL (ends with `/exec`)
3. Check that you've deployed a new version
4. Try accessing `?page=diagnostic` for automated tests

### Common Issues

- **Permission errors**: Make sure you've authorized the app and have access to the spreadsheet
- **Blank screen**: Clear cache and hard reload
- **Data not saving**: Check the Spreadsheet ID is correct in `code.gs`
- **"No Data Received" error**: 
  - Verify the `SPREADSHEET_ID` in `code.gs` matches your Google Sheet
  - Ensure you have edit access to the spreadsheet
  - Check the Apps Script logs (View > Logs in script editor) for detailed errors
  - Make sure the app is deployed as a Web App (not just saved)

### Browser Console Warnings

You may see warnings like:
- `Unrecognized feature: 'ambient-light-sensor'`
- `Unrecognized feature: 'speaker'`
- `Unrecognized feature: 'vibrate'`
- `Unrecognized feature: 'vr'`

**These are harmless warnings** from Google Apps Script's iframe embedding and can be safely ignored. They do not affect the app's functionality.

## Support

For issues or questions, please check the diagnostic page by adding `?page=diagnostic` to your Web App URL.
