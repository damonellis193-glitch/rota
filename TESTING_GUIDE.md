# Testing Guide: Rota App

## Overview
This guide covers testing for both the original OAuth authorization fix and the two new features added in the latest PR.

---

## New Feature Tests

### Test A: Book in My Morri — Filter by Name

**Prerequisites:** Log in as an Admin who is the line manager of at least 2 colleagues with approved Holiday or Sickness bookings not yet confirmed in My Morri.

**Steps:**
1. Navigate to the **Admin** page.
2. Locate the **Book in My Morri** section — confirm it is visible.
3. Verify a **"Filter"** bar appears below the header, with an **"All People"** dropdown button.
4. Click the dropdown button.
   - Confirm a panel opens with a search box, **Select all** / **Clear all** buttons, and a checkbox list of names.
   - Verify names are sorted alphabetically and deduplicated.
5. Type a partial name in the search box — verify the checkbox list filters live.
6. Select **one** name — confirm the table updates immediately to show only that person's rows.
7. Select a **second** name — confirm rows for both people are shown.
8. Click **Clear all** — confirm all rows are shown again (or the "no bookings" placeholder).
9. Click **Select all** — confirm all people are selected and all rows visible.
10. **Refresh the page** — confirm the filter resets to "All People" and no names are pre-selected.

**Expected Results:**
- ✅ Dropdown opens/closes correctly.
- ✅ Type-to-filter search works in real time.
- ✅ Single and multi-select filter the table correctly.
- ✅ Select all / Clear all work correctly.
- ✅ Filter resets completely on page refresh.

---

### Test B: Richer Audit Log Capture (backend)

**Prerequisites:** Log in as an Admin.

**Steps:**
1. Submit a new **Holiday** booking for a colleague.
2. Open the Admin → System Audit Logs section.
3. Find the most recent `SUBMIT` entry.
   - Confirm it contains: **Booking ID**, **Booking Type** (Holiday), **Target Person**, **Start Date**, **End Date**, **Status** (Pending or Approved).
4. As a manager, **approve** the booking.
5. Find the `APPROVE` entry — verify same fields are populated.
6. Have the colleague (or admin) **request cancellation** of the booking.
7. Find the `CANCEL` or `CANCEL_REQUEST` entry — verify **booking details are recorded** (not just the ID).
8. If the booking was Pending, verify it was deleted from the Bookings sheet but the audit row still records the full details.

**Expected Results:**
- ✅ `SUBMIT` entry includes booking ID, type, person, dates, status.
- ✅ `APPROVE`/`REJECT` entries include all booking fields.
- ✅ `CANCEL`/`CANCEL_REQUEST` entries capture details **before** the booking is removed.
- ✅ The AuditLogs Google Sheet has 10 columns (Timestamp, Actor, Action, Details, BookingID, BookingType, TargetPerson, StartDate, EndDate, Status).

---

### Test C: Audit Log UI — Search, Filter, Sort, Pagination, Export

**Prerequisites:** Log in as an Admin with at least several audit log entries.

**Steps:**
1. Open Admin → **System Audit Logs** (click the header to expand).
   - Verify the section loads and displays audit rows with all columns (Time, User, Action, Type, ID, Person, Start, End, Status, Details).
2. Type a search term (e.g. a colleague's name) in the **Search all fields** box — verify rows filter immediately.
3. Set a **From** date — verify only rows on or after that date are shown.
4. Set a **To** date — verify only rows within the range are shown.
5. Click the **User** dropdown, select one or more users — verify only their rows are shown.
6. Click the **Action** dropdown, select an action type — verify correct rows remain.
7. Click the **Booking type** dropdown, select a type (e.g. Holiday) — verify correct rows remain.
8. Click the **Time** column header — verify rows sort ascending/descending on click/re-click.
9. Click the **Action** column header — verify alphabetical sort.
10. With 51+ log entries: verify **pagination** shows "Page 1 of N", and the **next** button advances to page 2.
11. Click **Reset** — verify all filters clear and all rows are shown.
12. Click **Export CSV** — verify a `.csv` file downloads with correct headers and filtered rows.

**Expected Results:**
- ✅ Free-text search works across all fields.
- ✅ Date range filter works correctly.
- ✅ Multi-select dropdowns work for User, Action, Booking type.
- ✅ Column headers are clickable and toggle sort order.
- ✅ Pagination renders and prev/next navigate correctly.
- ✅ Reset clears all filters.
- ✅ CSV export downloads with correct data.
- ✅ All filters reset on page refresh (not persisted).

---

## Original OAuth Tests

### Test 1: Normal Authorization Flow (Happy Path)

**Objective**: Verify that authorization works correctly with normal browser settings

**Steps**:
1. Deploy the updated code as a new Web App deployment
2. Open the Web App URL in an incognito/private browser window
3. Verify that the permission request screen appears
4. Click the "Grant Permissions" button
5. Verify that a popup window opens
6. Verify that the popup shows "Requesting Permissions..." message
7. Wait for Google's OAuth consent screen to appear
8. Review the requested permissions
9. Click "Allow" on the OAuth consent screen
10. Verify that the popup closes automatically
11. Verify that the main app loads successfully
12. Verify that you can see the dashboard

**Expected Results**:
- ✅ Permission screen displays with clear instructions
- ✅ Popup opens without being blocked
- ✅ OAuth consent screen appears in popup
- ✅ After authorization, popup closes
- ✅ App loads and displays dashboard
- ✅ User email is displayed in navigation

---

### Test 2: Popup Blocker Detection

**Steps**:
1. Enable strict popup blocking in browser settings
2. Open the Web App URL in a new window
3. Click the "Grant Permissions" button
4. Verify that popup blocker alert appears
5. Click "Try Again" button and allow popups
6. Complete authorization

**Expected Results**:
- ✅ Popup blocker detection works
- ✅ Alert message is clear and helpful
- ✅ After allowing popups, flow works normally

---

## Troubleshooting Common Issues

### Issue: My Morri filter dropdown doesn't appear
**Solution**: The section is only visible for Admin users who are line managers of colleagues. Ensure the logged-in user is an Admin.

### Issue: Audit log section loads but shows "No matching entries"
**Solution**: Use the Reset button to clear all filters, or check that `getAllAuditLogs()` exists in the deployed `code.gs`.

### Issue: Audit log CSV export is empty
**Solution**: Ensure there are audit entries and no conflicting filter is active. Click Reset and try again.

### Issue: Popup doesn't open
**Solution**: Check if popup blocker is enabled; verify browser allows popups from the site.

### Issue: OAuth screen doesn't appear
**Solution**: Verify deployment is set to "Execute as: Me"; check OAuth scopes in `appsscript.json`.
