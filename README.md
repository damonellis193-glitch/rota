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

### 2. Configure Spreadsheet

1. Create a new Google Sheet
2. Copy the Spreadsheet ID from the URL
3. Update `SPREADSHEET_ID` in `code.gs`
4. Update `ADMIN_EMAILS` in `code.gs` with your email

### 3. Deploy

1. Click **Deploy** → **New deployment**
2. Select type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (or your preference)
5. Click **Deploy**
6. Copy the Web App URL

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
- `README.md` - This file

## Troubleshooting

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
