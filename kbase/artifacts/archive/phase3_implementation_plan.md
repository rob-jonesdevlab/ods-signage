# Phase 3: Reports Page Redesign - Implementation Plan

## Goal
Transform the Reports page from a data display page into a simple file upload interface for generating report PNGs. Remove all project data displays and add a drag & drop upload area.

## User Review Required

> [!IMPORTANT]
> **Breaking Change**: This will remove all project data display from the Reports page. The Project Status Detail table and summary stats will be moved to a new Project Status page in Phase 4.

## Proposed Changes

### [MODIFY] [report-dashboard.html](file:///Users/robert.leejones/Documents/GitHub/sdm-weekly-report/public/report-dashboard.html)

**Changes:**

1. **Remove Summary Stats Cards** (lines 112-173)
   - Delete all 4 stat cards: Total Active Projects, On Schedule, At Risk/Delayed, Budget Utilized
   - These will be moved to the new Project Status page in Phase 4

2. **Remove Project Status Detail Table** (lines 174-451)
   - Delete entire table section including header, filter input, and all table rows
   - This will be moved to the new Project Status page in Phase 4

3. **Update Report Type Dropdown** (lines 91-98)
   - Remove all options except "Project Status Report"
   - Keep only: `<option value="project_status">Project Status Report</option>`

4. **Change "Download Excel" to "Download PNG"** (lines 104-109)
   - Update button text from "Download Excel" to "Download PNG"
   - Change icon from `table_view` to `image`
   - Update icon color from `text-green-600` to `text-purple-600`

5. **Add Drag & Drop Upload Area**
   - Insert after the header section (after line 111)
   - Dark grey background (`bg-gray-800 dark:bg-gray-900`)
   - Dashed border for drag & drop visual
   - Upload icon and instructions
   - File input for click-to-upload
   - Accept `.xlsx` files only

**New Upload Area Design:**
```html
<!-- File Upload Area -->
<div class="mb-8">
    <div class="relative border-2 border-dashed border-gray-600 dark:border-gray-700 rounded-xl bg-gray-800 dark:bg-gray-900 p-12 text-center hover:border-primary transition-colors">
        <input type="file" id="file-upload" accept=".xlsx" class="hidden" />
        <div class="space-y-4">
            <div class="flex justify-center">
                <span class="material-symbols-outlined text-6xl text-gray-500">upload_file</span>
            </div>
            <div>
                <label for="file-upload" class="cursor-pointer">
                    <span class="text-lg font-semibold text-white">Drop your Excel file here</span>
                    <span class="block text-sm text-gray-400 mt-2">or click to browse</span>
                </label>
            </div>
            <p class="text-xs text-gray-500">Supports .xlsx files only</p>
        </div>
    </div>
</div>
```

---

### [MODIFY] [dashboard.html](file:///Users/robert.leejones/Documents/GitHub/sdm-weekly-report/public/dashboard.html)

**Changes:**

1. **Remove Banner Text** (lines 89-92)
   - Remove the description paragraph: "This is your central command center. Monitor system health, review pending updates, and generate strategic reports from here."
   - Keep the "SDI Hub" title
   - Result: Just the title with no description text

---

### [MODIFY] [report-dashboard.js](file:///Users/robert.leejones/Documents/GitHub/sdm-weekly-report/public/report-dashboard.js)

**Changes:**

1. **Remove table population logic**
   - Remove `loadReportData()` function
   - Remove any table rendering code

2. **Add file upload handler**
   - Implement drag & drop event listeners
   - Add file validation (xlsx only)
   - Add file upload to backend endpoint
   - Show upload progress/feedback

3. **Update download button**
   - Change from Excel download to PNG download
   - Update event handler to download PNG instead of Excel

## Verification Plan

### Manual Browser Testing

1. **Navigate to Reports Page**
   ```
   Open browser to http://localhost:3000/report-dashboard.html
   ```

2. **Verify Removals**
   - ✅ Summary stats cards are gone
   - ✅ Project Status Detail table is gone
   - ✅ Only "Project Status Report" option in dropdown

3. **Verify Upload Area**
   - ✅ Dark grey upload area is visible
   - ✅ Upload icon and text are centered
   - ✅ Clicking the area opens file picker
   - ✅ Only .xlsx files can be selected

4. **Verify Download Button**
   - ✅ Button says "Download PNG" not "Download Excel"
   - ✅ Icon is `image` not `table_view`
   - ✅ Icon color is purple

5. **Test Drag & Drop** (if implemented)
   - ✅ Dragging file over area changes border color
   - ✅ Dropping file triggers upload
   - ✅ Invalid file types show error

### Automated Testing
- No existing automated tests for this page
- Manual browser testing is sufficient for UI changes

---

## Implementation Steps

### Reports Page (report-dashboard.html)
1. Remove summary stats cards section
2. Remove Project Status Detail table section
3. Update dropdown to single option
4. Change Download button text and icon
5. Add drag & drop upload area HTML
6. Update JavaScript for file upload handling

### SDI Hub (dashboard.html)
7. Remove banner description text (keep title only)

### Testing
8. Test Reports page in browser with file upload
9. Test SDI Hub to verify banner removal

## Notes

- The removed components (stats cards and table) will be reused in Phase 4 for the new Project Status page
- File upload backend endpoint may need to be created if it doesn't exist
- PNG generation logic will be handled by backend (not part of this phase)
