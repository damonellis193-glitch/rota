/**
 * BACKEND CODE - GOOGLE APPS SCRIPT
 */

// CONFIGURATION
// This repository is pre-configured for a specific deployment.
// If you're forking this for your own use, replace the SPREADSHEET_ID below with your own.
const SPREADSHEET_ID = '1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM';

// Helper function to detect permission/authorization errors
function isPermissionError(errorMsg) {
  var lowerMsg = errorMsg.toLowerCase();
  return lowerMsg.includes('authorization') || 
         lowerMsg.includes('permission') || 
         lowerMsg.includes('access denied') ||
         lowerMsg.includes('no access') ||
         lowerMsg.includes('scripterror: authorization required');
}

// Authorization trigger function - designed to request OAuth scopes
// This function is intentionally simple and requires the necessary scopes
// Call this from the frontend to trigger the OAuth consent flow
function triggerAuthorization() {
  try {
    // Access spreadsheet to trigger OAuth consent for spreadsheets scope
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var spreadsheetId = ss.getId(); // Verify we can access the spreadsheet
    
    // Get user email to trigger userinfo.email scope
    var userEmail = Session.getActiveUser().getEmail();
    
    // Return success with user info
    return {
      authorized: true,
      user: userEmail,
      spreadsheetAccess: true,
      spreadsheetId: spreadsheetId,
      message: 'Authorization successful! You now have access to the app.'
    };
  } catch (e) {
    var errorMsg = e.toString();
    console.error('[Authorization] Error:', errorMsg);
    
    return {
      authorized: false,
      error: errorMsg,
      permissionDenied: isPermissionError(errorMsg),
      message: 'Authorization failed. Please try again or contact your administrator.'
    };
  }
}

// Check if user has already authorized the app
function checkAuthorization() {
  try {
    // Try to access resources to verify authorization
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var userEmail = Session.getActiveUser().getEmail();
    
    return {
      authorized: true,
      user: userEmail,
      message: 'Already authorized'
    };
  } catch (e) {
    var errorMsg = e.toString();
    
    return {
      authorized: false,
      error: errorMsg,
      permissionDenied: isPermissionError(errorMsg),
      message: 'Not authorized yet'
    };
  }
}

// Quick Setup Check
function checkSetup() {
  try {
    SpreadsheetApp.openById(SPREADSHEET_ID);
    return { configured: true, message: 'Configuration looks good!' };
  } catch (e) {
    var errorMsg = e.toString();
    
    return {
      configured: false,
      permissionDenied: isPermissionError(errorMsg),
      message: 'Cannot access spreadsheet. Error: ' + errorMsg + '. Check: 1) SPREADSHEET_ID is correct, 2) You have edit access to the spreadsheet, 3) You created a NEW deployment after updating the code'
    };
  }
}

// Diagnostic helper function to check configuration
function getConfigurationStatus() {
  const status = {
    timestamp: new Date().toISOString(),
    spreadsheetId: SPREADSHEET_ID,
    currentUser: Session.getActiveUser().getEmail(),
    setupCheck: checkSetup()
  };
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    status.spreadsheetAccessible = true;
    status.spreadsheetName = ss.getName();
    status.spreadsheetUrl = ss.getUrl();
  } catch (e) {
    status.spreadsheetAccessible = false;
    status.spreadsheetError = e.toString();
  }
  
  return status;
}

function doGet(e) {
  // Check if setup is complete
  const setupCheck = checkSetup();
  
  // Diagnostic mode: add ?page=diagnostic to URL
  if (e && e.parameter && e.parameter.page === 'diagnostic') {
    return HtmlService.createHtmlOutputFromFile('diagnostic')
      .setTitle('Rota Diagnostics');
  }
  
  // Setup mode: show setup guide if not configured
  if (!setupCheck.configured && e && e.parameter && e.parameter.page === 'setup') {
    return HtmlService.createHtmlOutputFromFile('setup')
      .setTitle('Rota Setup Required');
  }
  
  // Normal app - but warn if not configured
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Team Rota & Holiday Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// --- INITIALIZATION & SETUP ---

function getInitialData() {
  try {
    console.log('[Backend] getInitialData called');
    
    // Check configuration first
    const setupCheck = checkSetup();
    if (!setupCheck.configured) {
      console.error('[Backend] Setup incomplete: ' + setupCheck.message);
      return { 
        error: 'Setup Required: ' + setupCheck.message + ' - See README.md for setup instructions.',
        permissionDenied: setupCheck.permissionDenied || false
      };
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('[Backend] Spreadsheet opened');
    setupDatabase(ss); 
    
    const userEmail = Session.getActiveUser().getEmail();
    console.log('[Backend] User email: ' + userEmail);
    
    const empSheet = ss.getSheetByName('Employees');
    const bookSheet = ss.getSheetByName('Bookings');
    const schedSheet = ss.getSheetByName('Schedules');
    const auditSheet = ss.getSheetByName('AuditLogs');
    
    if (!empSheet || !bookSheet || !schedSheet) {
      console.error('[Backend] One or more sheets are missing');
      return { error: 'Database sheets are missing. Please check the spreadsheet setup.' };
    }
    
    // 1. Get Employees
    const empData = empSheet.getDataRange().getValues();
    if (empData.length > 0) empData.shift(); 
    
    const employees = empData
      .filter(r => r[0] && r[1] && r[2] && r[3]) // Filter rows with required fields: name, email, allowance, role
      .map(row => ({
        name: String(row[0]).trim(),
        email: String(row[1]).trim(),
        allowance: Number(row[2]) || 0,
        role: String(row[3]).trim(),
        manager: String(row[4] || '').trim(),
        department: String(row[5] || '').trim(), 
        carryOver: Number(row[6]) || 0    
      }));

    console.log('[Backend] Found ' + employees.length + ' employees');

    // Check current user - must be in the Employees sheet
    let currentUser = employees.find(e => e.email === userEmail);
    if (!currentUser) {
      return { accessDenied: true };
    }

    console.log('[Backend] Current user role: ' + currentUser.role);

    // 2. Get Bookings
    const bookData = bookSheet.getDataRange().getValues();
    let bookings = [];
    if (bookData.length > 1) {
      bookData.shift(); 
      bookings = bookData
        .filter(r => r[0] && r[1] && r[2] && r[3] && r[4] && r[6]) // Filter rows with required fields: id, email, type, dates, status (daysCount optional, defaults to 0)
        .map(row => ({
          id: String(row[0]).trim(),
          email: String(row[1]).trim(),
          type: String(row[2]).trim(), 
          startDate: row[3] ? new Date(row[3]).toISOString() : null,
          endDate: row[4] ? new Date(row[4]).toISOString() : null,
          daysCount: Number(row[5]) || 0,
          status: String(row[6]).trim(),
          hours: Number(row[7]) || 7.5 
        }));
    }

    console.log('[Backend] Found ' + bookings.length + ' bookings');

    // 3. Get Schedules
    const schedData = schedSheet.getDataRange().getValues();
    const schedules = {};
    if (schedData.length > 1) {
      schedData.shift(); 
      schedData.forEach(row => {
        // Only process rows with email, day, type and valid hours
        if (row[0] && row[1] && row[2]) {
          const email = String(row[0]).trim();
          const day = String(row[1]).trim();
          if (!schedules[email]) schedules[email] = {};
          schedules[email][day] = { 
            type: String(row[2]).trim(), 
            hours: Number(row[3]) || 7.5 
          };
        }
      });
    }

    // Convert schedules object to array for better serialization
    const schedulesArray = [];
    for (const email in schedules) {
      if (schedules.hasOwnProperty(email)) {
        schedulesArray.push({
          email: email,
          schedule: schedules[email]
        });
      }
    }

    // 4. Get Audit Logs (Last 50 for Admin Dashboard)
    let auditLogs = [];
    if (currentUser.role === 'Admin') {
      if (auditSheet) {
        try {
          const lastRow = auditSheet.getLastRow();
          const startRow = Math.max(2, lastRow - 49);
          if (lastRow > 1) {
            const range = auditSheet.getRange(startRow, 1, (lastRow - startRow + 1), 4);
            const rawLogs = range.getValues();
            auditLogs = rawLogs
              .filter(r => r[0] && r[1] && r[2]) // Filter rows with required fields
              .reverse()
              .map(r => ({
                timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
                actor: String(r[1]).trim(),
                action: String(r[2]).trim(),
                details: String(r[3] || '').trim()
              }));
          }
        } catch (auditError) {
          console.error('[Backend] Error loading audit logs: ' + auditError.toString());
          // Continue without audit logs - don't fail the entire request
          auditLogs = [];
        }
      }
    }

    // 5. Get Carryover Requests
    let carryoverRequests = [];
    if (currentUser.role === 'Admin' || currentUser.role === 'Manager') {
      const carryoverSheet = ss.getSheetByName('CarryoverRequests');
      if (carryoverSheet) {
        try {
          const carryoverData = carryoverSheet.getDataRange().getValues();
          if (carryoverData.length > 1) {
            carryoverData.shift();
            carryoverRequests = carryoverData
              .filter(r => r[0] && r[1] && r[3]) // Email, Hours, Status
              .map(r => ({
                email: String(r[0]).trim(),
                hours: Number(r[1]) || 0,
                reason: String(r[2] || '').trim(),
                status: String(r[3]).trim(),
                timestamp: r[4] ? (r[4] instanceof Date ? r[4].toISOString() : String(r[4])) : null,
                processedBy: String(r[5] || '').trim(),
                processedAt: r[6] ? (r[6] instanceof Date ? r[6].toISOString() : String(r[6])) : null
              }));
          }
        } catch (carryoverError) {
          console.error('[Backend] Error loading carryover requests: ' + carryoverError.toString());
          carryoverRequests = [];
        }
      }
    }

    // 6. Get Capacity Settings
    let capacitySettings = {};
    try {
      const capSheet = ss.getSheetByName('CapacitySettings');
      if (capSheet) {
        const capData = capSheet.getDataRange().getValues();
        if (capData.length > 1) {
          capData.shift();
          capData.forEach(row => {
            if (row[0]) {
              capacitySettings[String(row[0]).trim()] = Number(row[1]) || 0;
            }
          });
        }
      }
    } catch (capError) {
      console.error('[Backend] Error loading capacity settings: ' + capError.toString());
      capacitySettings = {};
    }

    // 7. Apply pending allowance changes (checked on every load)
    try {
      applyPendingAllowanceChanges(ss);
    } catch (applyError) {
      console.error('[Backend] Error applying allowance changes: ' + applyError.toString());
    }

    // 8. Get AllowanceChanges (pending only, for Admin)
    let allowanceChanges = [];
    if (currentUser.role === 'Admin') {
      try {
        const acSheet = ss.getSheetByName('AllowanceChanges');
        if (acSheet) {
          const acData = acSheet.getDataRange().getValues();
          if (acData.length > 1) {
            acData.shift();
            allowanceChanges = acData
              .filter(r => r[0] && r[4] === 'Pending')
              .map(r => ({
                email: String(r[0]).trim(),
                adjustmentHours: Number(r[1]) || 0,
                effectiveDate: r[2] ? (r[2] instanceof Date ? r[2].toISOString() : String(r[2])) : null,
                reason: String(r[3] || '').trim(),
                status: String(r[4]).trim(),
                createdBy: String(r[5] || '').trim(),
                createdAt: r[6] ? (r[6] instanceof Date ? r[6].toISOString() : String(r[6])) : null
              }));
          }
        }
      } catch (acError) {
        console.error('[Backend] Error loading allowance changes: ' + acError.toString());
        allowanceChanges = [];
      }
    }

    // 9. Get AppSettings
    let appSettings = {};
    try {
      const settingsSheet = ss.getSheetByName('AppSettings');
      if (settingsSheet) {
        const settingsData = settingsSheet.getDataRange().getValues();
        if (settingsData.length > 1) {
          settingsData.shift();
          settingsData.forEach(row => {
            if (row[0]) appSettings[String(row[0]).trim()] = String(row[1] || '').trim();
          });
        }
      }
    } catch (settingsError) {
      console.error('[Backend] Error loading app settings: ' + settingsError.toString());
      appSettings = {};
    }

    console.log('[Backend] Returning data successfully');
    console.log('[Backend] Employees count: ' + employees.length);
    console.log('[Backend] Bookings count: ' + bookings.length);
    console.log('[Backend] CurrentUser: ' + JSON.stringify(currentUser));

    const result = {
      currentUser: currentUser,
      employees: employees,
      bookings: bookings,
      schedules: schedulesArray,
      auditLogs: auditLogs,
      carryoverRequests: carryoverRequests,
      capacitySettings: capacitySettings,
      allowanceChanges: allowanceChanges,
      appSettings: appSettings
    };
    
    // Verify the result is valid before returning
    console.log('[Backend] Validation checks:');
    console.log('[Backend] - currentUser exists:', !!result.currentUser);
    console.log('[Backend] - employees is array:', Array.isArray(result.employees));
    console.log('[Backend] - bookings is array:', Array.isArray(result.bookings));
    console.log('[Backend] - schedules is array:', Array.isArray(result.schedules));
    console.log('[Backend] - auditLogs is array:', Array.isArray(result.auditLogs));
    
    if (!result.currentUser || 
        !Array.isArray(result.employees) || 
        !Array.isArray(result.bookings) || 
        !Array.isArray(result.schedules)) {
      console.error('[Backend] Result validation failed - some required fields are missing or invalid');
      return { error: 'Data validation failed. One or more required fields are missing or have invalid types.' };
    }
    
    // Test if the result can be serialized
    try {
      var testSerialization = JSON.stringify(result);
      console.log('[Backend] Serialization test passed, size: ' + testSerialization.length + ' bytes');
    } catch (serializationError) {
      console.error('[Backend] SERIALIZATION ERROR:', serializationError.toString());
      return { error: 'Data serialization failed: ' + serializationError.toString() };
    }
    
    console.log('[Backend] About to return result');
    return result;
  } catch (e) {
    console.error("[Backend] Error in getInitialData: " + e.toString());
    console.error("[Backend] Stack trace: " + e.stack);
    
    var errorMsg = e.toString();
    
    return { 
      error: 'Backend error: ' + errorMsg + ' - Please check that SPREADSHEET_ID in code.gs is correct and you have access to it.',
      permissionDenied: isPermissionError(errorMsg)
    };
  }
}

function setupDatabase(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss.getSheetByName('Employees')) {
    const s = ss.insertSheet('Employees');
    s.appendRow(['Name', 'Email', 'Annual Allowance (Hours)', 'Role', 'Manager', 'Department', 'CarryOver (Hours)']);
  }
  if (!ss.getSheetByName('Bookings')) {
    const s = ss.insertSheet('Bookings');
    s.appendRow(['BookingID', 'UserEmail', 'Type', 'StartDate', 'EndDate', 'DaysUsed', 'Status', 'Hours']);
  }
  if (!ss.getSheetByName('Schedules')) {
    const s = ss.insertSheet('Schedules');
    s.appendRow(['Email', 'DayOfWeek', 'DefaultType', 'DefaultHours']);
  }
  if (!ss.getSheetByName('AuditLogs')) {
    const s = ss.insertSheet('AuditLogs');
    s.appendRow(['Timestamp', 'Actor', 'Action', 'Details']);
  }
  if (!ss.getSheetByName('CarryoverRequests')) {
    const s = ss.insertSheet('CarryoverRequests');
    s.appendRow(['Email', 'Days', 'Reason', 'Status', 'Timestamp', 'ProcessedBy', 'ProcessedAt']);
  }
  if (!ss.getSheetByName('CapacitySettings')) {
    const s = ss.insertSheet('CapacitySettings');
    s.appendRow(['DayOfWeek', 'TargetCount']);
    // Initialize with default values
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => s.appendRow([day, 0]));
  }
  if (!ss.getSheetByName('MyMorriConfirmations')) {
    const s = ss.insertSheet('MyMorriConfirmations');
    s.appendRow(['BookingID', 'ConfirmedBy', 'ConfirmedAt', 'ConfirmedDate']);
  }
  if (!ss.getSheetByName('MyMorriRemovals')) {
    const s = ss.insertSheet('MyMorriRemovals');
    s.appendRow(['BookingID', 'RemovedBy', 'RemovedAt', 'RemovalDate']);
  }
  if (!ss.getSheetByName('AllowanceChanges')) {
    const s = ss.insertSheet('AllowanceChanges');
    s.appendRow(['Email', 'AdjustmentHours', 'EffectiveDate', 'Reason', 'Status', 'CreatedBy', 'CreatedAt', 'AppliedAt']);
  }
  if (!ss.getSheetByName('AppSettings')) {
    const s = ss.insertSheet('AppSettings');
    s.appendRow(['SettingKey', 'SettingValue']);
    s.appendRow(['emailNotificationsEnabled', 'false']);
    s.appendRow(['appUrl', '']);
  }
}

function logAction(actorEmail, action, details) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('AuditLogs');
    if (!sheet) { setupDatabase(ss); sheet = ss.getSheetByName('AuditLogs'); }
    sheet.appendRow([new Date(), actorEmail, action, details]);
  } catch(e) {
    console.error("Audit Log Failed: " + e.toString());
  }
}

function submitBooking(formObj) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Bookings');
  const schedSheet = ss.getSheetByName('Schedules');
  const empSheet = ss.getSheetByName('Employees');
  
  const currentUserEmail = Session.getActiveUser().getEmail();
  const bookingEmail = formObj.targetEmail || currentUserEmail;
  const id = new Date().getTime().toString();
  
  // FETCH USER SCHEDULE FOR ACCURATE CALCULATION
  const schedData = schedSheet.getDataRange().getValues();
  const userSchedule = {};
  if (schedData.length > 1) {
    schedData.shift();
    schedData.forEach(row => {
      if (row[0] === bookingEmail) {
        userSchedule[row[1]] = row[2]; // Day -> Type (e.g., 'None')
      }
    });
  }

  // Calculate Days Used and Hours - STRICTLY based on Schedule
  let daysUsed = 0;
  let hoursUsed = 0;
  const start = new Date(formObj.startDate);
  const end = new Date(formObj.endDate);
  let cur = new Date(start);
  
  while (cur <= end) {
    const dayName = cur.toLocaleDateString('en-US', { weekday: 'long' });
    const dayOfWeekIndex = cur.getDay(); 
    
    // Default Logic: Mon-Fri are working days
    let isWorkingDay = (dayOfWeekIndex !== 0 && dayOfWeekIndex !== 6);
    let dayHours = 7.5; // Default hours per day
    
    // Override if Custom Schedule exists
    if (Object.keys(userSchedule).length > 0) {
        // If schedule exists for this day, use it. 
        // If NO schedule entry for this day, assume it is NOT a working day (Part time logic)
        // Note: The previous logic assumed fallback to Mon-Fri. 
        // Correct logic for Part Time: If they have ANY schedule rows, we trust strictly those rows.
        if (userSchedule[dayName]) {
            isWorkingDay = (userSchedule[dayName] !== 'None');
        } else {
            // If they have a schedule defined for *some* days but not this one, assume None.
            isWorkingDay = false; 
        }
    }

    // Get hours from schedule if available
    if (isWorkingDay && schedData.length > 1) {
      const schedRow = schedData.find(row => row[0] === bookingEmail && row[1] === dayName);
      if (schedRow && schedRow[3]) {
        dayHours = Number(schedRow[3]) || 7.5;
      }
    }

    if (isWorkingDay) {
      daysUsed++;
      
      // For single-day bookings, use form hours; for multi-day, use schedule
      let bookingHours;
      if (start.getTime() === end.getTime()) {
        // Single day - use custom hours from form
        bookingHours = Number(formObj.hours) || dayHours;
      } else {
        // Multi-day - MUST use schedule hours for this specific day
        bookingHours = dayHours;
      }
      
      hoursUsed += bookingHours;
    }
    cur.setDate(cur.getDate() + 1);
  }
  
  // Override if user manually adjusted (though we trust the calc usually)
  // We'll stick to the calculated business days for consistency unless 0
  if (daysUsed === 0 && formObj.daysCount > 0) daysUsed = Number(formObj.daysCount);
  
  // If hours not calculated (single day booking with custom hours), use form value
  if (hoursUsed === 0 && formObj.hours) {
    hoursUsed = Number(formObj.hours);
  }
  
  // Ensure minimum hours for working day bookings
  if (hoursUsed === 0 && daysUsed > 0) {
    hoursUsed = daysUsed * 7.5;
  }

  // Determine booking status based on role-based permissions
  let status = 'Pending';
  
  const empData = empSheet.getDataRange().getValues();
  const allEmps = empData.slice(1).map(row => ({
    email: String(row[1] || '').trim(),
    name: String(row[0] || '').trim(),
    role: String(row[3] || '').trim(),
    manager: String(row[4] || '').trim()
  }));
  
  function isInChain(managerEmail, targetEmail) {
    if (managerEmail === targetEmail) return false;
    let current = allEmps.find(e => e.email === targetEmail);
    const visited = new Set();
    while (current && current.manager && !visited.has(current.email)) {
      visited.add(current.email);
      if (current.manager === managerEmail) return true;
      current = allEmps.find(e => e.email === current.manager);
    }
    return false;
  }
  
  const currentUserEmp = allEmps.find(e => e.email === currentUserEmail);
  const isBookingForOther = formObj.targetEmail && formObj.targetEmail !== currentUserEmail;

  if (!currentUserEmp) {
    return { success: false, message: 'User not found in system.' };
  }

  if (currentUserEmp.role === 'Admin') {
    // Admin can book for anyone; booking for someone else is auto-approved
    if (isBookingForOther) {
      status = 'Approved';
    } else {
      // Admin booking for themselves: check if they have a manager
      status = currentUserEmp.manager ? 'Pending' : 'Approved';
    }
  } else if (currentUserEmp.role === 'Manager') {
    if (isBookingForOther) {
      // Manager can only book for people in their chain
      if (!isInChain(currentUserEmail, formObj.targetEmail)) {
        return { success: false, message: 'You can only book for employees in your management chain.' };
      }
      status = 'Approved';
    } else {
      // Manager booking for themselves: pending (goes to their manager)
      status = 'Pending';
    }
  } else {
    // Employee: can only book for themselves
    if (isBookingForOther) {
      return { success: false, message: 'Employees can only book for themselves.' };
    }
    status = 'Pending';
  }

  sheet.appendRow([
    id,
    bookingEmail,
    formObj.type,
    formObj.startDate,
    formObj.endDate,
    daysUsed,
    status,
    hoursUsed
  ]);
  
  logAction(currentUserEmail, 'Booking Submitted', `Type: ${formObj.type}, For: ${bookingEmail}, Status: ${status}, Days: ${daysUsed}, Hours: ${hoursUsed}`);

  // Send email notification to direct manager if status is Pending and notifications are enabled
  if (status === 'Pending') {
    try {
      const appConfig = getAppSettings(SpreadsheetApp.openById(SPREADSHEET_ID));
      if (appConfig.emailNotificationsEnabled) {
        const bookingEmp = allEmps.find(e => e.email === bookingEmail);
        const managerEmail = bookingEmp ? bookingEmp.manager : null;
        if (managerEmail) {
          const empName = bookingEmp ? bookingEmp.name : bookingEmail;
          const appLink = appConfig.appUrl ? '\n\nView in app: ' + appConfig.appUrl : '';
          MailApp.sendEmail({
            to: managerEmail,
            subject: empName + ' has submitted a ' + formObj.type + ' request',
            body: `Hello,\n\n${empName} has submitted a ${formObj.type} request for ${formObj.startDate} to ${formObj.endDate} (${hoursUsed} hours).\n\nPlease review and approve or reject this request in the admin panel.${appLink}\n\nThank you,\nRota System`
          });
        }
      }
    } catch (emailErr) {
      console.error('Failed to send booking notification email: ' + emailErr.toString());
    }
  }

  return { success: true, id: id, status: status, daysCount: daysUsed, hours: hoursUsed };
}

function updateBookingStatus(bookingId, newStatus) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Bookings');
  const data = sheet.getDataRange().getValues();
  const actor = Session.getActiveUser().getEmail();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(bookingId)) {
      sheet.getRange(i + 1, 7).setValue(newStatus);
      const owner = data[i][1];
      logAction(actor, 'Status Change', `Booking ${bookingId} for ${owner} set to ${newStatus}`);
      return { success: true };
    }
  }
  return { success: false };
}

function requestBookingCancellation(bookingId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Bookings');
  const data = sheet.getDataRange().getValues();
  const actor = Session.getActiveUser().getEmail();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(bookingId)) {
      const currentStatus = data[i][6]; 
      if (currentStatus === 'Pending') {
        sheet.deleteRow(i + 1);
        logAction(actor, 'Booking Withdrawn', `ID: ${bookingId} (Soft Deleted)`);
        return { success: true, action: 'deleted' };
      } else if (currentStatus === 'Approved') {
        sheet.getRange(i + 1, 7).setValue('Cancellation Requested');
        logAction(actor, 'Cancellation Requested', `ID: ${bookingId}`);
        return { success: true, action: 'requested' };
      }
    }
  }
  return { success: false, message: 'Booking not found' };
}

function sendChaserEmails(recipientEmails, customMessage) {
  const actor = Session.getActiveUser().getEmail();
  const subject = "ACTION REQUIRED: Please Book Your Holidays";
  let body = "";
  if (customMessage && customMessage.trim() !== "") {
    body += customMessage + "\n\n--------------------------------\n\n";
  }
  body += "Hello,\n\nThis is a reminder to ensure you have booked your upcoming holidays and Bank Holidays into the Team Rota system.\n\nPlease log in and update your schedule as soon as possible.\n\nThank you,\nRota Admin Team";
  
  let sentCount = 0;
  recipientEmails.forEach(email => {
    if(email && email.includes('@')) {
      try {
        MailApp.sendEmail({ to: email, subject: subject, body: body });
        sentCount++;
      } catch(e) {
        console.error("Failed to send to " + email);
      }
    }
  });
  
  logAction(actor, 'Chaser Emails Sent', `Sent to ${sentCount} recipients.`);
  return { success: true, count: sentCount };
}

function saveEmployee(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Employees');
  const values = sheet.getDataRange().getValues();
  const actor = Session.getActiveUser().getEmail();
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === data.email) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = [data.name, data.email, data.allowance, data.role, data.manager, data.department, data.carryOver];
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, 7).setValues([rowData]);
    logAction(actor, 'Employee Updated', `Updated profile for ${data.email}`);
  } else {
    sheet.appendRow(rowData);
    logAction(actor, 'Employee Created', `Created profile for ${data.email}`);
  }
  return { success: true };
}

function deleteEmployee(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Employees');
  const values = sheet.getDataRange().getValues();
  const actor = Session.getActiveUser().getEmail();

  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === email) {
      sheet.deleteRow(i + 1);
      logAction(actor, 'Employee Deleted', `Deleted profile for ${email}`);
      return { success: true };
    }
  }
  return { success: false };
}

function saveUserSchedule(email, scheduleMap) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Schedules');
  const data = sheet.getDataRange().getValues();
  const actor = Session.getActiveUser().getEmail();

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === email) {
      sheet.deleteRow(i + 1);
    }
  }
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  days.forEach(day => {
    if (scheduleMap[day] && scheduleMap[day].type !== 'None') {
      sheet.appendRow([email, day, scheduleMap[day].type, scheduleMap[day].hours]);
    }
  });
  logAction(actor, 'Schedule Updated', `Updated schedule for ${email}`);
  return { success: true };
}

// --- CARRYOVER REQUEST FUNCTIONS ---

function submitCarryoverRequest(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('CarryoverRequests');
  if (!sheet) {
    setupDatabase(ss);
  }
  
  const userEmail = Session.getActiveUser().getEmail();
  const actor = userEmail;
  
  // Check if user already has a pending request
  const existingData = sheet.getDataRange().getValues();
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === userEmail && existingData[i][3] === 'Pending') {
      return { success: false, message: 'You already have a pending carryover request.' };
    }
  }
  
  // Validate hours
  if (!data.hours || data.hours <= 0) {
    return { success: false, message: 'Carryover must be greater than 0 hours.' };
  }
  
  sheet.appendRow([
    userEmail,
    data.hours,
    data.reason || '',
    'Pending',
    new Date(),
    '',
    ''
  ]);
  
  logAction(actor, 'Carryover Requested', `Requested ${data.hours} hours carryover`);
  
  // Send email notification to direct manager if notifications enabled
  try {
    const empSheet = ss.getSheetByName('Employees');
    const empData = empSheet.getDataRange().getValues();
    const employee = empData.find(r => String(r[1]).trim() === userEmail);
    
    if (employee && employee[4]) { // Has manager
      const appConfig = getAppSettings(ss);
      if (appConfig.emailNotificationsEnabled) {
        const managerEmail = String(employee[4]).trim();
        const employeeName = String(employee[0]).trim();
        const appLink = appConfig.appUrl ? '\n\nView in app: ' + appConfig.appUrl : '';
        
        MailApp.sendEmail({
          to: managerEmail,
          subject: 'Holiday Carryover Request from ' + employeeName,
          body: `Hello,\n\n${employeeName} has submitted a request to carry over ${data.hours} hours of holiday allowance to the next fiscal year.\n\nReason: ${data.reason || 'No reason provided'}\n\nPlease review this request in the admin panel.${appLink}\n\nThank you,\nRota System`
        });
      }
    }
  } catch (e) {
    console.error('Failed to send email notification: ' + e.toString());
  }
  
  return { success: true };
}

function approveCarryoverRequest(email, requestedHours) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const carryoverSheet = ss.getSheetByName('CarryoverRequests');
  const empSheet = ss.getSheetByName('Employees');
  const actor = Session.getActiveUser().getEmail();
  
  // Find and update the request
  const carryoverData = carryoverSheet.getDataRange().getValues();
  let requestRow = -1;
  for (let i = 1; i < carryoverData.length; i++) {
    if (carryoverData[i][0] === email && carryoverData[i][3] === 'Pending') {
      requestRow = i + 1;
      break;
    }
  }
  
  if (requestRow === -1) {
    return { success: false, message: 'Request not found or already processed.' };
  }
  
  // Update the request status
  carryoverSheet.getRange(requestRow, 4).setValue('Approved');
  carryoverSheet.getRange(requestRow, 6).setValue(actor);
  carryoverSheet.getRange(requestRow, 7).setValue(new Date());
  
  // Update employee's CarryOver field by ADDING the requested hours
  const empData = empSheet.getDataRange().getValues();
  for (let i = 1; i < empData.length; i++) {
    if (String(empData[i][1]).trim() === email) {
      const currentCarryover = Number(empData[i][6]) || 0;
      empSheet.getRange(i + 1, 7).setValue(currentCarryover + requestedHours);
      break;
    }
  }
  
  logAction(actor, 'Carryover Approved', `Approved ${requestedHours} hours carryover for ${email}`);
  
  // Send email notification
  try {
    const empDataLatest = empSheet.getDataRange().getValues();
    const employee = empDataLatest.find(r => String(r[1]).trim() === email);
    const employeeName = employee ? String(employee[0]).trim() : email;
    
    MailApp.sendEmail({
      to: email,
      subject: 'Holiday Carryover Request Approved',
      body: `Hello ${employeeName},\n\nYour request to carry over ${requestedHours} hours of holiday allowance has been approved!\n\nThis will be added to your allowance for the next fiscal year.\n\nThank you,\nRota System`
    });
  } catch (e) {
    console.error('Failed to send email notification: ' + e.toString());
  }
  
  return { success: true };
}

function rejectCarryoverRequest(email, days) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const carryoverSheet = ss.getSheetByName('CarryoverRequests');
  const empSheet = ss.getSheetByName('Employees');
  const actor = Session.getActiveUser().getEmail();
  
  // Find and update the request
  const carryoverData = carryoverSheet.getDataRange().getValues();
  let requestRow = -1;
  for (let i = 1; i < carryoverData.length; i++) {
    if (carryoverData[i][0] === email && carryoverData[i][3] === 'Pending') {
      requestRow = i + 1;
      break;
    }
  }
  
  if (requestRow === -1) {
    return { success: false, message: 'Request not found or already processed.' };
  }
  
  // Update the request status
  carryoverSheet.getRange(requestRow, 4).setValue('Rejected');
  carryoverSheet.getRange(requestRow, 6).setValue(actor);
  carryoverSheet.getRange(requestRow, 7).setValue(new Date());
  
  logAction(actor, 'Carryover Rejected', `Rejected carryover request for ${email}`);
  
  // Send email notification
  try {
    const empData = empSheet.getDataRange().getValues();
    const employee = empData.find(r => String(r[1]).trim() === email);
    const employeeName = employee ? String(employee[0]).trim() : email;
    const requestHours = carryoverData[requestRow - 1][1];
    
    MailApp.sendEmail({
      to: email,
      subject: 'Holiday Carryover Request Update',
      body: `Hello ${employeeName},\n\nYour request to carry over ${requestHours} hours of holiday allowance has been reviewed.\n\nUnfortunately, this request could not be approved at this time. Please contact your manager for more information.\n\nThank you,\nRota System`
    });
  } catch (e) {
    console.error('Failed to send email notification: ' + e.toString());
  }
  
  return { success: true };
}

// --- APP SETTINGS FUNCTIONS ---

function getAppSettings(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('AppSettings');
  if (!sheet) return { emailNotificationsEnabled: false, appUrl: '' };
  const data = sheet.getDataRange().getValues();
  const settings = { emailNotificationsEnabled: false, appUrl: '' };
  if (data.length > 1) {
    data.slice(1).forEach(row => {
      if (row[0] === 'emailNotificationsEnabled') settings.emailNotificationsEnabled = String(row[1]).trim() === 'true';
      if (row[0] === 'appUrl') settings.appUrl = String(row[1] || '').trim();
    });
  }
  return settings;
}

function saveAppSettings(settingsObj) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('AppSettings');
  if (!sheet) {
    setupDatabase(ss);
    sheet = ss.getSheetByName('AppSettings');
  }
  const actor = Session.getActiveUser().getEmail();
  const data = sheet.getDataRange().getValues();
  const keys = Object.keys(settingsObj);
  keys.forEach(key => {
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(settingsObj[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, settingsObj[key]]);
    }
  });
  logAction(actor, 'App Settings Updated', 'Updated application settings');
  return { success: true };
}

// --- ALLOWANCE CHANGES FUNCTIONS ---

function saveAllowanceChange(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('AllowanceChanges');
  if (!sheet) {
    setupDatabase(ss);
    sheet = ss.getSheetByName('AllowanceChanges');
  }
  const actor = Session.getActiveUser().getEmail();
  
  // Check for existing pending change for this employee
  const existingData = sheet.getDataRange().getValues();
  for (let i = 1; i < existingData.length; i++) {
    if (String(existingData[i][0]).trim() === data.email && existingData[i][4] === 'Pending') {
      return { success: false, message: 'This employee already has a pending scheduled change.' };
    }
  }
  
  // Validate effective date is strictly in the future (must be tomorrow or later)
  const effectiveDate = new Date(data.effectiveDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  effectiveDate.setHours(0, 0, 0, 0);
  if (effectiveDate.getTime() <= today.getTime()) {
    return { success: false, message: 'Effective date must be in the future.' };
  }
  
  sheet.appendRow([
    data.email,
    data.adjustmentHours,
    data.effectiveDate,
    data.reason || '',
    'Pending',
    actor,
    new Date(),
    ''
  ]);
  
  logAction(actor, 'Allowance Change Scheduled', `Scheduled ${data.adjustmentHours} hour adjustment for ${data.email}, effective ${data.effectiveDate}`);
  return { success: true };
}

function cancelAllowanceChange(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('AllowanceChanges');
  const actor = Session.getActiveUser().getEmail();
  
  if (!sheet) return { success: false, message: 'AllowanceChanges sheet not found.' };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === email && data[i][4] === 'Pending') {
      sheet.getRange(i + 1, 5).setValue('Cancelled');
      logAction(actor, 'Allowance Change Cancelled', `Cancelled pending allowance change for ${email}`);
      return { success: true };
    }
  }
  return { success: false, message: 'No pending change found for this employee.' };
}

function applyPendingAllowanceChanges(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const acSheet = ss.getSheetByName('AllowanceChanges');
  const empSheet = ss.getSheetByName('Employees');
  if (!acSheet || !empSheet) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const acData = acSheet.getDataRange().getValues();
  const empData = empSheet.getDataRange().getValues();
  
  for (let i = 1; i < acData.length; i++) {
    const email = String(acData[i][0]).trim();
    const adjustmentHours = Number(acData[i][1]) || 0;
    const effectiveDateRaw = acData[i][2];
    const status = String(acData[i][4]).trim();
    
    if (status !== 'Pending') continue;
    
    const effectiveDate = new Date(effectiveDateRaw);
    effectiveDate.setHours(0, 0, 0, 0);
    
    if (effectiveDate > today) continue;
    
    // Apply the change to employee's allowance
    for (let j = 1; j < empData.length; j++) {
      if (String(empData[j][1]).trim() === email) {
        const currentAllowance = Number(empData[j][2]) || 0;
        empSheet.getRange(j + 1, 3).setValue(currentAllowance + adjustmentHours);
        break;
      }
    }
    
    // Mark as Applied
    acSheet.getRange(i + 1, 5).setValue('Applied');
    acSheet.getRange(i + 1, 8).setValue(new Date());
    
    logAction('system', 'Allowance Change Applied', `Applied ${adjustmentHours} hour adjustment for ${email}`);
  }
}

function getAllowanceChanges() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('AllowanceChanges');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  data.shift();
  return data
    .filter(r => r[0] && r[4] === 'Pending')
    .map(r => ({
      email: String(r[0]).trim(),
      adjustmentHours: Number(r[1]) || 0,
      effectiveDate: r[2] ? (r[2] instanceof Date ? r[2].toISOString() : String(r[2])) : null,
      reason: String(r[3] || '').trim(),
      status: String(r[4]).trim(),
      createdBy: String(r[5] || '').trim(),
      createdAt: r[6] ? (r[6] instanceof Date ? r[6].toISOString() : String(r[6])) : null
    }));
}

// --- CAPACITY SETTINGS FUNCTIONS ---

function getCapacitySettings() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('CapacitySettings');
  if (!sheet) {
    setupDatabase(ss);
    return getCapacitySettings();
  }
  
  const data = sheet.getDataRange().getValues();
  const settings = {};
  if (data.length > 1) {
    data.shift(); // Remove header
    data.forEach(row => {
      if (row[0]) {
        settings[String(row[0]).trim()] = Number(row[1]) || 0;
      }
    });
  }
  
  return settings;
}

function saveCapacitySettings(settingsObj) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('CapacitySettings');
  if (!sheet) {
    setupDatabase(ss);
    sheet = ss.getSheetByName('CapacitySettings');
  }
  
  const actor = Session.getActiveUser().getEmail();
  
  // Clear existing data (except header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  // Write new settings
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  days.forEach(day => {
    const target = settingsObj[day] || 0;
    sheet.appendRow([day, target]);
  });
  
  logAction(actor, 'Capacity Settings Updated', `Updated capacity targets for all days`);
  return { success: true };
}

// --- MY MORRI CONFIRMATIONS FUNCTIONS ---

function getMyMorriBookings() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookSheet = ss.getSheetByName('Bookings');
  const confirmSheet = ss.getSheetByName('MyMorriConfirmations');
  const empSheet = ss.getSheetByName('Employees');
  const currentUserEmail = Session.getActiveUser().getEmail();
  
  if (!confirmSheet) {
    setupDatabase(ss);
  }
  
  // Get confirmed booking IDs
  const confirmedIds = {};
  if (confirmSheet) {
    const confirmData = confirmSheet.getDataRange().getValues();
    if (confirmData.length > 1) {
      confirmData.shift();
      confirmData.forEach(row => {
        if (row[0]) confirmedIds[String(row[0])] = true;
      });
    }
  }
  
  // Get all employees to check manager hierarchy
  const empData = empSheet.getDataRange().getValues();
  empData.shift();
  const employees = empData.map(row => ({
    email: String(row[1]).trim(),
    name: String(row[0]).trim(),
    manager: String(row[4] || '').trim()
  }));
  
  // Helper function to check if current user is manager of employee
  function isManagerOf(managerEmail, employeeEmail) {
    if (managerEmail === employeeEmail) return false;
    let current = employees.find(e => e.email === employeeEmail);
    while (current && current.manager) {
      if (current.manager === managerEmail) return true;
      current = employees.find(e => e.email === current.manager);
    }
    return false;
  }
  
  // Get bookings
  const bookData = bookSheet.getDataRange().getValues();
  const bookings = [];
  if (bookData.length > 1) {
    bookData.shift();
    bookData.forEach(row => {
      const bookingId = String(row[0]).trim();
      const email = String(row[1]).trim();
      const type = String(row[2]).trim();
      const status = String(row[6]).trim();
      
      // Filter: Only approved Holiday and Sickness, not already confirmed, NOT cancellation requested, user is manager
      if ((type === 'Holiday' || type === 'Sickness') && 
          status === 'Approved' && 
          status !== 'Cancellation Requested' &&
          !confirmedIds[bookingId] &&
          isManagerOf(currentUserEmail, email)) {
        
        const emp = employees.find(e => e.email === email);
        bookings.push({
          id: bookingId,
          name: (emp || {}).name || email,
          email: email,
          type: type,
          startDate: row[3] ? new Date(row[3]).toISOString() : null,
          endDate: row[4] ? new Date(row[4]).toISOString() : null,
          hours: Number(row[7]) || 0
        });
      }
    });
  }
  
  return { success: true, bookings: bookings };
}

function confirmMyMorriBookings(bookingIds) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('MyMorriConfirmations');
  if (!sheet) {
    setupDatabase(ss);
    sheet = ss.getSheetByName('MyMorriConfirmations');
  }
  
  const actor = Session.getActiveUser().getEmail();
  const now = new Date();
  
  bookingIds.forEach(id => {
    sheet.appendRow([id, actor, now, now]);
  });
  
  logAction(actor, 'My Morri Confirmations', `Confirmed ${bookingIds.length} booking(s)`);
  return { success: true, count: bookingIds.length };
}

function getMyMorriRemovals() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bookSheet = ss.getSheetByName('Bookings');
  const confirmSheet = ss.getSheetByName('MyMorriConfirmations');
  const removalSheet = ss.getSheetByName('MyMorriRemovals');
  const empSheet = ss.getSheetByName('Employees');
  const currentUserEmail = Session.getActiveUser().getEmail();
  
  if (!removalSheet) {
    setupDatabase(ss);
  }
  
  // Get already removed booking IDs
  const removedIds = {};
  if (removalSheet) {
    const removalData = removalSheet.getDataRange().getValues();
    if (removalData.length > 1) {
      removalData.shift();
      removalData.forEach(row => {
        if (row[0]) removedIds[String(row[0])] = true;
      });
    }
  }
  
  // Get confirmed booking IDs (from My Morri)
  const confirmedIds = {};
  if (confirmSheet) {
    const confirmData = confirmSheet.getDataRange().getValues();
    if (confirmData.length > 1) {
      confirmData.shift();
      confirmData.forEach(row => {
        if (row[0]) confirmedIds[String(row[0])] = true;
      });
    }
  }
  
  // Get employees for manager hierarchy
  const empData = empSheet.getDataRange().getValues();
  empData.shift();
  const employees = empData.map(row => ({
    email: String(row[1]).trim(),
    name: String(row[0]).trim(),
    manager: String(row[4] || '').trim()
  }));
  
  // Helper function
  function isManagerOf(managerEmail, employeeEmail) {
    if (managerEmail === employeeEmail) return false;
    let current = employees.find(e => e.email === employeeEmail);
    while (current && current.manager) {
      if (current.manager === managerEmail) return true;
      current = employees.find(e => e.email === current.manager);
    }
    return false;
  }
  
  // Get bookings
  const bookData = bookSheet.getDataRange().getValues();
  const removals = [];
  if (bookData.length > 1) {
    bookData.shift();
    bookData.forEach(row => {
      const bookingId = String(row[0]).trim();
      const email = String(row[1]).trim();
      const type = String(row[2]).trim();
      const status = String(row[6]).trim();
      
      // Filter: Only Holiday, Cancelled status, was confirmed in My Morri, not yet removed, user is manager
      if (type === 'Holiday' && 
          status === 'Cancelled' &&
          confirmedIds[bookingId] &&
          !removedIds[bookingId] &&
          isManagerOf(currentUserEmail, email)) {
        
        const emp = employees.find(e => e.email === email);
        removals.push({
          id: bookingId,
          name: (emp || {}).name || email,
          email: email,
          startDate: row[3] ? new Date(row[3]).toISOString() : null,
          endDate: row[4] ? new Date(row[4]).toISOString() : null,
          hours: Number(row[7]) || 0
        });
      }
    });
  }
  
  return { success: true, removals: removals };
}

function confirmMyMorriRemovals(bookingIds) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('MyMorriRemovals');
  if (!sheet) {
    setupDatabase(ss);
    sheet = ss.getSheetByName('MyMorriRemovals');
  }
  
  const actor = Session.getActiveUser().getEmail();
  const now = new Date();
  
  bookingIds.forEach(id => {
    sheet.appendRow([id, actor, now, now]);
  });
  
  logAction(actor, 'My Morri Removals Confirmed', `Removed ${bookingIds.length} cancelled booking(s) from My Morri`);
  return { success: true, count: bookingIds.length };
}
