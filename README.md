# Team Rota - Holiday Manager

A comprehensive team holiday and absence management system built for Google Apps Script.

## Recent Updates

### v2.0 - Chunked Data Loading (Latest)
**Fixed:** Google Apps Script data transfer limitation issue that caused the app to fail with null data.

**What Changed:**
- Replaced single large data payload with multiple small API calls
- Added visual loading progress with status updates
- Improved reliability for larger datasets
- Faster initial load times

**Technical Details:**
- Backend split into 5 focused API endpoints (getCurrentUser, getEmployees, getBookings, getSchedules, getAuditLogs)
- Frontend loads data sequentially with progress feedback
- All existing functionality preserved (100% backward compatible)

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
- ✅ **NEW: Chunked data loading for improved reliability**

## Quick Start

✅ **This repository is pre-configured!** The spreadsheet ID is already set, so you can deploy immediately.

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

⚠️ **IMPORTANT**: The spreadsheet ID is already configured in this repository! You only need to set up your spreadsheet with the correct structure.

1. Open the configured Google Sheet at:
   - Spreadsheet ID: `1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM`
   - URL: `https://docs.google.com/spreadsheets/d/1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM/edit`

2. The app will automatically create the necessary sheets on first run

3. Add employees to the **Employees** sheet with these columns:
   - Name, Email, Annual Allowance, Role, Manager, Department, CarryOver
   - Set Role to "Admin" for users who should have admin access
   - Set Role to "Manager" for users who can approve requests
   - Set Role to "User" for regular employees

4. Admin access is controlled by the **Employees** sheet - no need to configure emails in code!

### 3. Deploy

The spreadsheet ID is already configured! Just deploy the app:

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select type: **Web app**
4. Set configuration:
   - **Description**: Team Rota v1.0
   - **Execute as**: **Me** (your email)
   - **Who has access**: Choose based on your needs:
     - **Only myself** - Only you can access
     - **Anyone** - Public access
     - **Anyone with Google account** - Requires Google login
     - **Anyone within [your domain]** - Organization only
5. Click **Deploy**
6. **Authorize the app** when prompted (first time only)
7. Copy the **Web App URL** (ends with `/exec`)

**Note:** The code is pre-configured with your spreadsheet ID, so you can deploy immediately!

### 4. First Run

1. Open the Web App URL
2. Grant necessary permissions
3. The app will automatically create required sheets
4. Add employees via the Admin panel

## Files

- `code.gs` - Backend Google Apps Script code (pre-configured with spreadsheet ID)
- `index.html` - Main application UI
- `diagnostic.html` - Diagnostic testing page
- `setup.html` - Step-by-step setup guide
- `appsscript.json` - Apps Script project manifest (OAuth scopes, timezone, etc.)
- `README.md` - This file

## Troubleshooting

**📖 The spreadsheet ID is now pre-configured in this repository!**

### Permission Errors

If you get "Cannot access spreadsheet" errors:

1. **Check spreadsheet permissions**: 
   - Open the Google Sheet at: https://docs.google.com/spreadsheets/d/1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM/edit
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
5. **NEW:** Watch the loading progress bar - it will show which data chunk is loading

### Common Issues

- **Permission errors**: Make sure you've authorized the app and have access to the spreadsheet
- **Blank screen**: Clear cache and hard reload
- **Data not saving**: Check the Spreadsheet ID is correct in `code.gs`
- **"No Data Received" error**: 
  - Verify the `SPREADSHEET_ID` in `code.gs` matches your Google Sheet
  - Ensure you have edit access to the spreadsheet
  - Check the Apps Script logs (View > Logs in script editor) for detailed errors
  - Make sure the app is deployed as a Web App (not just saved)
  - **NEW:** Check which data chunk failed in the loading progress indicator
- **Data loading slowly**: This is normal with chunked loading - the app loads data in 5 separate chunks for reliability

### Browser Console Warnings

You may see warnings like:
- `Unrecognized feature: 'ambient-light-sensor'`
- `Unrecognized feature: 'speaker'`
- `Unrecognized feature: 'vibrate'`
- `Unrecognized feature: 'vr'`

**These are harmless warnings** from Google Apps Script's iframe embedding and can be safely ignored. They do not affect the app's functionality.

### "No Data Received" or Blank Data Issues

**FIXED in v2.0:** The chunked loading architecture eliminates the data transfer size limitation issues.

If you still see errors like `[Rota App] Data is null or undefined`, this is usually caused by:

1. **Blank cells in your spreadsheet data**: The app now automatically filters out rows with missing required fields
   - For **Employees**: Name, Email, Allowance, and Role are required
   - For **Bookings**: ID, Email, Type, Start Date, End Date, and Status are required
   - For **Schedules**: Email, Day, and Type are required

2. **Solution**: 
   - Remove any rows from your spreadsheet that have blank cells in required columns
   - Or fill in the required fields for those rows
   - The app will skip incomplete rows automatically and load successfully with the valid data

3. **Note**: It's normal to have extra empty rows at the bottom of your spreadsheet. These are automatically filtered out and won't cause issues.

## Support

For issues or questions, please check the diagnostic page by adding `?page=diagnostic` to your Web App URL.
