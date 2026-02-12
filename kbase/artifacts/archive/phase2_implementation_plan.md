# Phase 2: Advanced Features Implementation Plan

## Goal
Enhance the ODS Digital Signage Dashboard with advanced features for power users: real-time notifications, sophisticated filtering, data export capabilities, enhanced search/sort, and bulk operations.

---

## 1. Real-time Notifications 🔔

### Overview
Toast notification system for player status changes, content uploads, and system alerts.

### Components

#### [NEW] [Toast.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/components/Toast.tsx)

**Individual toast notification component**

**Props:**
- `id`: Unique identifier
- `type`: 'success' | 'error' | 'warning' | 'info'
- `title`: Notification title
- `message`: Notification message
- `duration`: Auto-dismiss time (ms)
- `onClose`: Close handler

**Features:**
- Slide-in animation from top-right
- Auto-dismiss after duration
- Manual close button
- Icon based on type
- Progress bar showing time remaining

#### [NEW] [ToastContainer.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/components/ToastContainer.tsx)

**Container managing multiple toasts**

**Features:**
- Fixed position (top-right)
- Stack toasts vertically
- Max 5 toasts visible
- Auto-remove oldest when limit reached
- Z-index above modals

#### [NEW] [useToast.ts](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/hooks/useToast.ts)

**Custom hook for toast management**

```typescript
const { showToast } = useToast();

// Usage
showToast({
    type: 'success',
    title: 'Player Online',
    message: 'Player 04 - London Lobby is now online',
    duration: 5000
});
```

### Integration Points

**Players Page:**
- Player goes online → Success toast
- Player goes offline → Warning toast
- Player connection error → Error toast

**Content Library:**
- Upload success → Success toast
- Upload failure → Error toast
- Delete success → Info toast

**Playlists:**
- Playlist created → Success toast
- Playlist updated → Info toast
- Playlist deleted → Warning toast

**Operations:**
- High storage usage → Warning toast
- Database latency spike → Error toast
- System update available → Info toast

### WebSocket Integration

Update existing WebSocket listeners to trigger toasts:

```typescript
socket.on('player:online', (player) => {
    showToast({
        type: 'success',
        title: 'Player Online',
        message: `${player.name} is now online`
    });
});

socket.on('player:offline', (player) => {
    showToast({
        type: 'warning',
        title: 'Player Offline',
        message: `${player.name} has gone offline`
    });
});
```

---

## 2. Advanced Filtering with Date Pickers 📅

### Components

#### [NEW] [DateRangePicker.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/components/DateRangePicker.tsx)

**Date range selection component**

**Features:**
- Start date and end date inputs
- Calendar popup (using native `<input type="date">`)
- Preset ranges:
  - Today
  - Last 7 days
  - Last 30 days
  - Last 90 days
  - Custom range
- Clear button
- Apply button

**Props:**
- `startDate`: Date | null
- `endDate`: Date | null
- `onChange`: (start: Date | null, end: Date | null) => void
- `presets`: boolean (show preset buttons)

#### [NEW] [FilterPanel.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/components/FilterPanel.tsx)

**Unified filter panel for all pages**

**Features:**
- Slide-out panel from right
- Date range picker
- Type filters (checkboxes)
- Status filters (checkboxes)
- Size range slider
- Duration range slider
- Apply/Reset buttons
- Active filter count badge

### Integration

**Content Library:**
- Filter by upload date
- Filter by type (image, video, URL)
- Filter by size range
- Filter by duration

**Players:**
- Filter by last seen date
- Filter by status (online, offline, warning)
- Filter by location/group

**Playlists:**
- Filter by created date
- Filter by updated date
- Filter by creator

**Analytics:**
- Filter metrics by date range
- Filter by content type
- Filter by player group

---

## 3. CSV/PDF Export Functionality 📊

### Components

#### [NEW] [ExportButton.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/components/ExportButton.tsx)

**Export dropdown button**

**Features:**
- Dropdown menu with options:
  - Export as CSV
  - Export as PDF
  - Export as JSON
- Icon button with dropdown
- Loading state during export
- Success/error feedback

#### [NEW] [useExport.ts](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/hooks/useExport.ts)

**Custom hook for data export**

**Functions:**
- `exportToCSV(data, filename)`: Convert to CSV and download
- `exportToPDF(data, filename, title)`: Generate PDF and download
- `exportToJSON(data, filename)`: Convert to JSON and download

**Libraries:**
- **CSV**: Custom implementation (no library needed)
- **PDF**: `jsPDF` + `jspdf-autotable` for tables

### Integration Points

**Content Library:**
- Export content list with metadata
- Include: Name, Type, Size, Duration, Upload Date

**Players:**
- Export player list with status
- Include: Name, Status, Location, Last Seen, Uptime

**Playlists:**
- Export playlist details
- Include: Name, Items, Created By, Created Date

**Analytics:**
- Export analytics report
- Include: KPIs, Top Content, Performance Metrics

---

## 4. Enhanced Search & Sort 🔍

### Components

#### [NEW] [SearchBar.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/components/SearchBar.tsx)

**Advanced search component**

**Features:**
- Debounced search (300ms)
- Search icon with loading spinner
- Clear button (X)
- Keyboard shortcuts (Cmd+K to focus)
- Search suggestions dropdown
- Recent searches history

**Props:**
- `value`: string
- `onChange`: (value: string) => void
- `placeholder`: string
- `suggestions`: string[]
- `onSuggestionClick`: (suggestion: string) => void

#### [NEW] [SortDropdown.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/components/SortDropdown.tsx)

**Advanced sort dropdown**

**Features:**
- Multiple sort options
- Ascending/Descending toggle
- Active sort indicator
- Icon for sort direction

**Sort Options by Page:**

**Content Library:**
- Name (A-Z, Z-A)
- Upload Date (Newest, Oldest)
- File Size (Largest, Smallest)
- Type (Image, Video, URL)

**Players:**
- Name (A-Z, Z-A)
- Status (Online first, Offline first)
- Last Seen (Recent, Oldest)
- Location (A-Z, Z-A)

**Playlists:**
- Name (A-Z, Z-A)
- Created Date (Newest, Oldest)
- Items Count (Most, Least)
- Last Updated (Recent, Oldest)

### Implementation

**Debounced Search:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');

useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
}, [searchQuery]);

// Use debouncedQuery for API calls
```

**Multi-field Search:**
```typescript
const filteredContent = content.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.metadata.originalName.toLowerCase().includes(query.toLowerCase()) ||
    item.type.toLowerCase().includes(query.toLowerCase())
);
```

---

## 5. Bulk Operations ✅

### Components

#### [NEW] [BulkActionBar.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/components/BulkActionBar.tsx)

**Bulk action toolbar**

**Features:**
- Appears when items selected
- Shows selection count
- Action buttons:
  - Delete selected
  - Move to folder
  - Add to playlist
  - Export selected
  - Clear selection
- Confirmation dialogs
- Progress indicator for bulk operations

**Props:**
- `selectedCount`: number
- `onDelete`: () => void
- `onMove`: () => void
- `onAddToPlaylist`: () => void
- `onExport`: () => void
- `onClearSelection`: () => void

#### [MODIFY] Content Cards

**Add selection checkbox:**
- Checkbox in top-left corner
- Show on hover or when any item selected
- Shift+Click for range selection
- Cmd/Ctrl+Click for multi-select
- Select All checkbox in header

### Bulk Operations by Page

**Content Library:**
- Select multiple content items
- Bulk delete
- Bulk move to folder
- Bulk add to playlist
- Bulk export

**Players:**
- Select multiple players
- Bulk assign to group
- Bulk restart
- Bulk update settings
- Bulk export

**Playlists:**
- Select multiple playlists
- Bulk delete
- Bulk duplicate
- Bulk export

### Implementation

**Selection State:**
```typescript
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        return next;
    });
};

const selectAll = () => {
    setSelectedItems(new Set(content.map(item => item.id)));
};

const clearSelection = () => {
    setSelectedItems(new Set());
};
```

**Bulk Delete:**
```typescript
const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedItems.size} items?`)) return;
    
    const promises = Array.from(selectedItems).map(id =>
        fetch(`http://localhost:3001/api/content/${id}`, {
            method: 'DELETE'
        })
    );
    
    await Promise.all(promises);
    await fetchContent();
    clearSelection();
    showToast({
        type: 'success',
        title: 'Deleted',
        message: `${selectedItems.size} items deleted`
    });
};
```

---

## Design Specifications

### Toast Notifications
- **Position**: Fixed top-right, 24px from edges
- **Width**: 360px
- **Max Stack**: 5 toasts
- **Animation**: Slide in from right (200ms ease-out)
- **Auto-dismiss**: 5 seconds default
- **Colors**:
  - Success: `bg-emerald-500`
  - Error: `bg-red-500`
  - Warning: `bg-amber-500`
  - Info: `bg-blue-500`

### Filter Panel
- **Width**: 320px
- **Animation**: Slide in from right (300ms ease-in-out)
- **Backdrop**: `bg-black/50 backdrop-blur-sm`
- **Sections**: Collapsible with chevron icons

### Export Button
- **Position**: Top-right of page header
- **Dropdown**: Slide down (150ms)
- **Icons**: Material Symbols (download, description, data_object)

### Bulk Action Bar
- **Position**: Fixed bottom, full width
- **Height**: 64px
- **Background**: `bg-slate-800 border-t border-slate-700`
- **Shadow**: `shadow-2xl shadow-black/50`
- **Animation**: Slide up from bottom (200ms)

---

## Verification Plan

### Manual Testing

1. **Real-time Notifications**
   - [ ] Toast appears on player status change
   - [ ] Toast auto-dismisses after duration
   - [ ] Manual close works
   - [ ] Multiple toasts stack correctly
   - [ ] Max 5 toasts enforced

2. **Date Range Filtering**
   - [ ] Date picker opens and closes
   - [ ] Preset ranges work
   - [ ] Custom range works
   - [ ] Filters apply correctly
   - [ ] Clear filters works

3. **CSV/PDF Export**
   - [ ] CSV export downloads
   - [ ] PDF export generates correctly
   - [ ] JSON export works
   - [ ] Exported data is accurate
   - [ ] Filename includes date

4. **Enhanced Search & Sort**
   - [ ] Search debounces correctly
   - [ ] Multi-field search works
   - [ ] Sort options apply
   - [ ] Ascending/descending toggle works
   - [ ] Keyboard shortcuts work

5. **Bulk Operations**
   - [ ] Checkbox selection works
   - [ ] Shift+Click range selection works
   - [ ] Select all works
   - [ ] Bulk delete works
   - [ ] Bulk move works
   - [ ] Bulk export works

---

## Timeline

- **Toast Notifications**: 1.5 hours
- **Date Range Filtering**: 2 hours
- **CSV/PDF Export**: 2 hours
- **Enhanced Search & Sort**: 1.5 hours
- **Bulk Operations**: 2.5 hours
- **Testing & Polish**: 1.5 hours

**Total**: ~11 hours

---

## Dependencies

**New NPM Packages:**
```bash
npm install jspdf jspdf-autotable
```

**No other external dependencies needed** - We'll build most features with vanilla React and Tailwind CSS.
