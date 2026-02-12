# Phase 1: Missing Design Implementations

## Goal
Implement three Stitch-designed components to enhance UX: Empty states for Content Library and Playlists, plus a Media Preview Modal for viewing content details.

## Proposed Changes

### 1. Empty State Components

#### [NEW] [EmptyState.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/components/EmptyState.tsx)

Create a reusable empty state component:

**Props:**
- `icon`: Material Symbol icon name
- `title`: Main heading text
- `description`: Supporting text
- `actionLabel`: Button text
- `onAction`: Button click handler
- `showSecondaryActions`: Optional links (docs, tutorials)

**Features:**
- Glassmorphic card with gradient glow effects
- Animated icon with pulse effects
- Responsive design
- Customizable colors and icons

---

### 2. Content Library Empty State

#### [MODIFY] [page.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/app/content/page.tsx)

**Changes:**
- Add conditional rendering: show `EmptyState` when `content.length === 0`
- Keep upload zone visible even when empty
- Use `palette` icon with gradient (blue to purple)
- Title: "No content yet"
- Description: "Your library is looking a little empty. Upload your first image or video to get started creating amazing displays."
- Action: "Upload Media" (triggers file upload)

**Layout:**
```tsx
{content.length === 0 ? (
  <div className="flex flex-col gap-6">
    {/* Upload Zone */}
    <UploadZone />
    {/* Empty State */}
    <EmptyState 
      icon="palette"
      title="No content yet"
      description="..."
      actionLabel="Upload Media"
      onAction={handleUploadClick}
    />
  </div>
) : (
  {/* Existing content grid */}
)}
```

---

### 3. Playlists Empty State

#### [MODIFY] [page.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/app/playlists/page.tsx)

**Changes:**
- Add conditional rendering for empty playlists
- Use `queue_music` icon with blue glow
- Title: "No playlists yet"
- Description: "Create your first playlist to get started organizing your digital signage content into effective schedules."
- Action: "Create Playlist" (opens create modal)
- Secondary actions: "Read Documentation" and "Watch Tutorial" links

**Layout:**
```tsx
{playlists.length === 0 ? (
  <EmptyState 
    icon="queue_music"
    title="No playlists yet"
    description="..."
    actionLabel="Create Playlist"
    onAction={() => setShowCreateModal(true)}
    showSecondaryActions={true}
  />
) : (
  {/* Existing playlist grid */}
)}
```

---

### 4. Media Preview Modal

#### [NEW] [MediaPreviewModal.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/components/MediaPreviewModal.tsx)

Create a modal component for previewing media files:

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `media`: ContentItem (with metadata)

**Features:**

1. **Modal Backdrop**
   - Full-screen overlay with `bg-black/80 backdrop-blur-sm`
   - Click outside to close
   - ESC key to close

2. **Header Section**
   - Media filename as title
   - "Detailed preview" subtitle
   - Close button (X icon)

3. **Preview Area**
   - Video player with custom controls
   - Play/pause button (center overlay)
   - Progress bar with scrubbing
   - Volume control
   - Fullscreen toggle
   - Settings button
   - Time display (current / total)

4. **Metadata Grid**
   - 2-column responsive layout
   - Display: Type, Duration, Size, Uploaded date, Filename, Resolution
   - Icons for visual clarity
   - Glassmorphic background

5. **Footer Actions**
   - Delete button (left, red theme)
   - Close button (center)
   - Edit Details button (right, primary theme)

**Integration Points:**
- Add to Content Library: Click on content card opens modal
- Add to Playlists: Click on content item in playlist editor

---

### 5. Content Library Integration

#### [MODIFY] [page.tsx](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/app/content/page.tsx)

**Add Modal State:**
```tsx
const [previewMedia, setPreviewMedia] = useState<ContentItem | null>(null);
```

**Update Content Cards:**
```tsx
<div 
  onClick={() => setPreviewMedia(item)}
  className="cursor-pointer hover:scale-105 transition-transform"
>
  {/* Existing card content */}
</div>
```

**Add Modal Component:**
```tsx
<MediaPreviewModal 
  isOpen={!!previewMedia}
  onClose={() => setPreviewMedia(null)}
  media={previewMedia}
/>
```

---

## Design Specifications

### Colors
- **Primary**: `#3c83f6` (blue-600)
- **Primary Hover**: `#2563eb` (blue-700)
- **Background**: `#020617` (slate-950)
- **Surface**: `#0f172a` (slate-900)
- **Border**: `#1e293b` (slate-800)

### Animations
- Empty state icon: Pulse glow on hover
- Modal: Fade in/out with scale animation
- Buttons: Lift effect on hover (`-translate-y-0.5`)

### Responsive Breakpoints
- Mobile: < 768px (single column, full-width buttons)
- Tablet: 768px - 1024px (adjusted spacing)
- Desktop: > 1024px (full layout)

---

## Verification Plan

### Manual Testing

1. **Content Library Empty State**
   - [ ] Clear all content from database
   - [ ] Verify empty state displays with upload zone
   - [ ] Click "Upload Media" triggers file picker
   - [ ] Upload file and verify empty state disappears

2. **Playlists Empty State**
   - [ ] Delete all playlists
   - [ ] Verify empty state displays
   - [ ] Click "Create Playlist" opens modal
   - [ ] Secondary links are clickable
   - [ ] Create playlist and verify empty state disappears

3. **Media Preview Modal**
   - [ ] Click on content item in library
   - [ ] Verify modal opens with correct data
   - [ ] Test video controls (play, pause, scrub, volume)
   - [ ] Test fullscreen toggle
   - [ ] Click outside modal to close
   - [ ] Press ESC to close
   - [ ] Test "Delete Media" button
   - [ ] Test "Edit Details" button
   - [ ] Verify responsive layout on mobile

4. **Responsive Design**
   - [ ] Test on mobile (< 768px)
   - [ ] Test on tablet (768-1024px)
   - [ ] Test on desktop (> 1024px)
   - [ ] Verify modal scrolls on small screens

---

## Timeline

- **EmptyState Component**: 30 min
- **Content Library Integration**: 20 min
- **Playlists Integration**: 20 min
- **MediaPreviewModal Component**: 60 min
- **Testing & Polish**: 30 min

**Total**: ~2.5 hours
