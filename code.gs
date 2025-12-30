/**
 * BACKEND CODE - GOOGLE APPS SCRIPT
 */

// CONFIGURATION
const SPREADSHEET_ID = '1vEDieQC-FJFybCVXuynVrus04U1ZA72XMkvfrtDK5MM'; // Replace with your Sheet ID
const ADMIN_EMAILS = ['your_email@domain.com']; 

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Team Rota & Holiday Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// --- INITIALIZATION & SETUP ---

function getInitialData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    setupDatabase(ss); 
    
    const userEmail = Session.getActiveUser().getEmail();
    
    const empSheet = ss.getSheetByName('Employees');
    const bookSheet = ss.getSheetByName('Bookings');
    const schedSheet = ss.getSheetByName('Schedules');
    const auditSheet = ss.getSheetByName('AuditLogs');
    
    // 1. Get Employees
    const empData = empSheet.getDataRange().getValues();
    if (empData.length > 0) empData.shift(); 
    
    const employees = empData.filter(r => r[0]).map(row => ({
      name: String(row[0]),
      email: String(row[1]),
      allowance: Number(row[2]),
      role: String(row[3]),
      manager: String(row[4] || ''),
      department: String(row[5] || ''), 
      carryOver: Number(row[6] || 0)    
    }));

    // Check current user
    let currentUser = employees.find(e => e.email === userEmail);
    if (!currentUser && ADMIN_EMAILS.includes(userEmail)) {
      currentUser = { name: 'Admin', email: userEmail, allowance: 25, role: 'Admin' };
    } else if (!currentUser) {
      currentUser = { name: 'Guest', email: userEmail, allowance: 0, role: 'Guest' };
    }

    // 2. Get Bookings
    const bookData = bookSheet.getDataRange().getValues();
    let bookings = [];
    if (bookData.length > 1) {
      bookData.shift(); 
      bookings = bookData.filter(r => r[0]).map(row => ({
        id: String(row[0]),
        email: String(row[1]),
        type: String(row[2]), 
        startDate: row[3] ? new Date(row[3]).toISOString() : null,
        endDate: row[4] ? new Date(row[4]).toISOString() : null,
        daysCount: Number(row[5]),
        status: String(row[6]),
        hours: Number(row[7] || 7.5) 
      }));
    }

    // 3. Get Schedules
    const schedData = schedSheet.getDataRange().getValues();
    const schedules = {};
    if (schedData.length > 1) {
      schedData.shift(); 
      schedData.forEach(row => {
        if (row[0]) {
          const email = String(row[0]);
          const day = String(row[1]);
          if(!schedules[email]) schedules[email] = {};
          schedules[email][day] = { type: String(row[2]), hours: Number(row[3] || 7.5) };
        }
      });
    }

    // 4. Get Audit Logs (Last 50 for Admin Dashboard)
    let auditLogs = [];
    if (currentUser.role === 'Admin') {
      if (auditSheet) {
        const lastRow = auditSheet.getLastRow();
        const startRow = Math.max(2, lastRow - 49);
        if (lastRow > 1) {
          const range = auditSheet.getRange(startRow, 1, (lastRow - startRow + 1), 4);
          const rawLogs = range.getValues();
          auditLogs = rawLogs.reverse().map(r => ({
            timestamp: r[0],
            actor: r[1],
            action: r[2],
            details: r[3]
          }));
        }
      }
    }

    return {
      currentUser: currentUser,
      employees: employees,
      bookings: bookings,
      schedules: schedules,
      auditLogs: auditLogs
    };
  } catch (e) {
    console.error("Server Error: " + e.toString());
    return { error: e.toString() };
  }
}

function setupDatabase(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss.getSheetByName('Employees')) {
    const s = ss.insertSheet('Employees');
    s.appendRow(['Name', 'Email', 'Annual Allowance', 'Role', 'Manager', 'Department', 'CarryOver']);
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

  // Calculate Days Used - STRICTLY based on Schedule
  let daysUsed = 0;
  const start = new Date(formObj.startDate);
  const end = new Date(formObj.endDate);
  let cur = new Date(start);
  
  while (cur <= end) {
    const dayName = cur.toLocaleDateString('en-US', { weekday: 'long' });
    const dayOfWeekIndex = cur.getDay(); 
    
    // Default Logic: Mon-Fri are working days
    let isWorkingDay = (dayOfWeekIndex !== 0 && dayOfWeekIndex !== 6);
    
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

    // Special Types that don't consume allowance
    if (['Sickness', 'Maternity', 'Travel', 'WFH'].includes(formObj.type)) {
        // We still count "days covered" but we might treat allowance differently in frontend.
        // For DB, we usually store the working days involved.
    }

    if (isWorkingDay) {
      daysUsed++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  
  // Override if user manually adjusted (though we trust the calc usually)
  // We'll stick to the calculated business days for consistency unless 0
  if (daysUsed === 0 && formObj.daysCount > 0) daysUsed = Number(formObj.daysCount);

  let status = 'Pending';
  if (formObj.targetEmail && formObj.targetEmail !== currentUserEmail) {
    status = 'Approved';
  }

  sheet.appendRow([
    id,
    bookingEmail,
    formObj.type,
    formObj.startDate,
    formObj.endDate,
    daysUsed,
    status,
    formObj.hours || 7.5
  ]);
  
  logAction(currentUserEmail, 'Booking Submitted', `Type: ${formObj.type}, For: ${bookingEmail}, Status: ${status}, Days: ${daysUsed}`);

  return { success: true, id: id, status: status, daysCount: daysUsed };
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
