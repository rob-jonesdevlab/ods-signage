'use client';

// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { API_URL } from '@/lib/api';

import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Header from '@/components/Header';
import FolderTree from '@/components/FolderTree';
import Breadcrumbs from '@/components/Breadcrumbs';
import NewFolderModal from '@/components/NewFolderModal';
import FolderContextMenu from '@/components/FolderContextMenu';
import RenameFolderModal from '@/components/RenameFolderModal';
import DeleteFolderModal from '@/components/DeleteFolderModal';
import MoveFolderModal from '@/components/MoveFolderModal';
import EmptyState from '@/components/EmptyState';
import MediaPreviewModal from '@/components/MediaPreviewModal';
import { useToast } from '@/hooks/useToast';
import SearchBar from '@/components/SearchBar';
import SortDropdown, { SortOption } from '@/components/SortDropdown';
import ExportButton from '@/components/ExportButton';
import DateRangePicker from '@/components/DateRangePicker';
import FilterDropdown from '@/components/FilterDropdown';
import BulkActionBar from '@/components/BulkActionBar';
import { useBulkSelection } from '@/hooks/useBulkSelection';

interface Content {
    id: string;
    name: string;
    type: 'image' | 'video' | 'url';
    url: string;
    duration: number;
    metadata: {
        originalName: string;
        mimeType: string;
        size: number;
        thumbnail?: string;
        uploadedAt: string;
    };
    created_at: string;
    uploaded_by?: string;
}

interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    is_system: number;
    itemCount: number;
    children: Folder[];
}

interface BreadcrumbSegment {
    id: string | null;
    name: string;
}

export default function ContentLibraryPage() {
    const [content, setContent] = useState<Content[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbSegment[]>([{ id: null, name: 'All Content' }]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedContent, setSelectedContent] = useState<Content | null>(null);
    const [previewMedia, setPreviewMedia] = useState<Content | null>(null);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [showUrlModal, setShowUrlModal] = useState(false);
    const [urlForm, setUrlForm] = useState({ name: '', url: '', duration: 10, isNonStop: false });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [draggedContent, setDraggedContent] = useState<string | null>(null);
    const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
    const { showToast } = useToast();

    // Sort options for content
    const sortOptions: SortOption[] = [
        { label: 'Newest First', value: 'newest', direction: 'desc' },
        { label: 'Oldest First', value: 'oldest', direction: 'asc' },
        { label: 'Name (A-Z)', value: 'name-asc', direction: 'asc' },
        { label: 'Name (Z-A)', value: 'name-desc', direction: 'desc' },
        { label: 'Largest Files', value: 'size-desc', direction: 'desc' },
        { label: 'Smallest Files', value: 'size-asc', direction: 'asc' },
    ];

    // Filter states
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [typeFilters, setTypeFilters] = useState<string[]>([]);

    const typeFilterOptions = [
        { label: 'Images', value: 'image', icon: 'image', color: 'text-yellow-400' },
        { label: 'Videos', value: 'video', icon: 'videocam', color: 'text-purple-400' },
        { label: 'URLs', value: 'url', icon: 'link', color: 'text-blue-400' },
    ];

    // Bulk selection
    const {
        selectedCount,
        toggleSelection,
        selectAll,
        deselectAll,
        isSelected,
        getSelectedItems,
    } = useBulkSelection(content);

    // Context menu and folder action states
    const [contextMenu, setContextMenu] = useState<{ folderId: string; x: number; y: number } | null>(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [selectedFolderForAction, setSelectedFolderForAction] = useState<string | null>(null);

    // Fetch folders
    const fetchFolders = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/folders/tree`);
            if (!res.ok) {
                console.error('Failed to fetch folders:', res.status);
                setFolders([]);
                return;
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setFolders(data);
            } else {
                console.error('Folders data is not an array:', data);
                setFolders([]);
            }
        } catch (error) {
            console.error('Error fetching folders:', error);
            setFolders([]);
        }
    }, []);

    // Fetch content
    const fetchContent = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (sortBy !== 'newest') params.append('sort', sortBy);

            const queryString = params.toString();
            const url = selectedFolderId
                ? `http://localhost:3001/api/folders/${selectedFolderId}/content${queryString ? `?${queryString}` : ''}`
                : `http://localhost:3001/api/content${queryString ? `?${queryString}` : ''}`;

            const res = await fetch(url);
            const data = await res.json();
            setContent(data);
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, sortBy, selectedFolderId]);

    useEffect(() => {
        fetchFolders();
        fetchContent();
    }, [fetchFolders, fetchContent]);

    // Build breadcrumb path
    const buildBreadcrumbPath = useCallback((folderId: string | null) => {
        if (!folderId) {
            setBreadcrumbPath([{ id: null, name: 'All Content' }]);
            return;
        }

        const path: BreadcrumbSegment[] = [{ id: null, name: 'All Content' }];

        const findPath = (folders: Folder[], targetId: string, currentPath: Folder[]): Folder[] | null => {
            for (const folder of folders) {
                if (folder.id === targetId) {
                    return [...currentPath, folder];
                }
                if (folder.children.length > 0) {
                    const result = findPath(folder.children, targetId, [...currentPath, folder]);
                    if (result) return result;
                }
            }
            return null;
        };

        const folderPath = findPath(folders, folderId, []);
        if (folderPath) {
            folderPath.forEach(folder => {
                path.push({ id: folder.id, name: folder.name });
            });
        }

        setBreadcrumbPath(path);
    }, [folders]);

    // Handle folder selection
    const handleSelectFolder = (folderId: string | null) => {
        setSelectedFolderId(folderId);
        buildBreadcrumbPath(folderId);
    };

    // Handle breadcrumb navigation
    const handleBreadcrumbNavigate = (folderId: string | null) => {
        handleSelectFolder(folderId);
    };

    // Create new folder
    const handleCreateFolder = async (name: string, parentId: string | null) => {
        try {
            const res = await fetch(`${API_URL}/api/folders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, parent_id: parentId }),
            });

            if (res.ok) {
                await fetchFolders();
            } else {
                throw new Error('Failed to create folder');
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    };

    // Upload handler with drag & drop
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploading(true);
        let successCount = 0;
        let failCount = 0;

        for (const file of acceptedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name);

            try {
                const res = await fetch(`${API_URL}/api/content`, {
                    method: 'POST',
                    body: formData,
                });

                if (res.ok) {
                    console.log('✅ Uploaded:', file.name);
                    successCount++;
                } else {
                    console.error('❌ Upload failed:', file.name);
                    failCount++;
                }
            } catch (error) {
                console.error('Error uploading:', error);
                failCount++;
            }
        }

        setUploading(false);
        fetchContent();

        // Show toast notification
        if (successCount > 0) {
            showToast({
                type: 'success',
                title: 'Upload Complete',
                message: `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`,
                duration: 5000
            });
        }
        if (failCount > 0) {
            showToast({
                type: 'error',
                title: 'Upload Failed',
                message: `Failed to upload ${failCount} file${failCount > 1 ? 's' : ''}`,
                duration: 5000
            });
        }
    }, [fetchContent, showToast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
            'video/*': ['.mp4', '.webm', '.mov'],
        },
        multiple: true,
    });

    // Delete content
    const deleteContent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this content?')) return;

        try {
            const res = await fetch(`http://localhost:3001/api/content/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchContent();
                setSelectedContent(null);
                showToast({
                    type: 'info',
                    title: 'Content Deleted',
                    message: 'Content has been removed from library',
                    duration: 4000
                });
            } else {
                showToast({
                    type: 'error',
                    title: 'Delete Failed',
                    message: 'Failed to delete content',
                    duration: 5000
                });
            }
        } catch (error) {
            console.error('Error deleting content:', error);
            showToast({
                type: 'error',
                title: 'Delete Error',
                message: 'An error occurred while deleting',
                duration: 5000
            });
        }
    };

    // Add URL content
    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!urlForm.url || !urlForm.name) {
            alert('Please provide both name and URL');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/content/url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: urlForm.name,
                    url: urlForm.url,
                    duration: urlForm.isNonStop ? -1 : urlForm.duration,
                    isNonStop: urlForm.isNonStop,
                }),
            });

            if (res.ok) {
                setShowUrlModal(false);
                setUrlForm({ name: '', url: '', duration: 10, isNonStop: false });
                fetchContent();
            } else {
                alert('Failed to add URL');
            }
        } catch (error) {
            console.error('Error adding URL:', error);
            alert('Error adding URL');
        }
    };

    // Drag and drop content to folder
    const handleContentDragStart = (contentId: string) => {
        setDraggedContent(contentId);
    };

    const handleContentDragEnd = () => {
        setDraggedContent(null);
        setDragOverFolder(null);
    };

    const handleFolderDrop = async (folderId: string) => {
        if (!draggedContent) return;

        try {
            const res = await fetch(`http://localhost:3001/api/folders/${folderId}/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content_id: draggedContent }),
            });

            if (res.ok) {
                alert('✅ Content added to folder successfully!');
                await fetchFolders();
                await fetchContent();
            } else {
                alert('❌ Failed to add content to folder');
            }
        } catch (error) {
            console.error('Error adding content to folder:', error);
            alert('❌ Error adding content to folder');
        } finally {
            setDraggedContent(null);
            setDragOverFolder(null);
        }
    };

    // Context menu handlers
    const handleFolderContextMenu = (folderId: string, event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenu({
            folderId,
            x: event.clientX,
            y: event.clientY,
        });
    };

    const handleRenameFolder = async (folderId: string, newName: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/folders/${folderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });

            if (res.ok) {
                alert('✅ Folder renamed successfully!');
                await fetchFolders();
            } else {
                alert('❌ Failed to rename folder');
            }
        } catch (error) {
            console.error('Error renaming folder:', error);
            alert('❌ Error renaming folder');
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/folders/${folderId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('✅ Folder deleted successfully!');
                await fetchFolders();
                await fetchContent();
                // If deleted folder was selected, reset to all content
                if (selectedFolderId === folderId) {
                    setSelectedFolderId(null);
                    setBreadcrumbPath([{ id: null, name: 'All Content' }]);
                }
            } else if (res.status === 403) {
                const data = await res.json();
                alert('🔒 ' + (data.error || 'Cannot delete system folder'));
            } else {
                alert('❌ Failed to delete folder');
            }
        } catch (error) {
            console.error('Error deleting folder:', error);
            alert('❌ Error deleting folder');
        }
    };

    // Bulk delete handler
    const handleBulkDelete = async () => {
        const selectedItems = getSelectedItems();
        if (selectedItems.length === 0) return;

        const confirmed = confirm(`Delete ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}?`);
        if (!confirmed) return;

        try {
            await Promise.all(selectedItems.map(item =>
                fetch(`http://localhost:3001/api/content/${item.id}`, { method: 'DELETE' })
            ));

            await fetchContent();
            deselectAll();
            showToast({
                type: 'success',
                title: 'Bulk Delete Complete',
                message: `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} deleted`,
                duration: 4000
            });
        } catch (error) {
            console.error('Error bulk deleting:', error);
            showToast({
                type: 'error',
                title: 'Bulk Delete Failed',
                message: 'Some items could not be deleted',
                duration: 5000
            });
        }
    };

    const handleMoveFolder = async (folderId: string, newParentId: string | null) => {
        try {
            const res = await fetch(`http://localhost:3001/api/folders/${folderId}/move`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parent_id: newParentId }),
            });

            if (res.ok) {
                alert('✅ Folder moved successfully!');
                await fetchFolders();
            } else {
                alert('❌ Failed to move folder');
            }
        } catch (error) {
            console.error('Error moving folder:', error);
            alert('❌ Error moving folder');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const imageCount = content.filter(c => c.type === 'image').length;
    const videoCount = content.filter(c => c.type === 'video').length;
    const urlCount = content.filter(c => c.type === 'url').length;
    const folderCount = folders.length;
    const totalCount = content.length;

    return (
        <div className="min-h-screen">
            <Header />
            {/* Main Content - Two Column Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Folder Sidebar */}
                <aside className="w-72 border-r border-gray-200 bg-gray-50 overflow-y-auto p-4">
                    <div className="mb-4">
                        <button
                            onClick={() => setShowNewFolderModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
                            New Folder
                        </button>
                    </div>
                    <FolderTree
                        folders={folders}
                        selectedFolderId={selectedFolderId}
                        onSelectFolder={handleSelectFolder}
                        onContextMenu={handleFolderContextMenu}
                        onFolderDrop={handleFolderDrop}
                        dragOverFolder={dragOverFolder}
                        setDragOverFolder={setDragOverFolder}
                    />
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto">
                    <div className="w-full max-w-[1600px] mx-auto p-6 md:p-8 flex flex-col gap-4">
                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Content Library</h1>
                                <p className="text-gray-500 mt-1">Manage and organize your digital signage assets.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowUrlModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">link</span>
                                    Add URL
                                </button>
                                <button
                                    {...getRootProps()}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                                    Upload Media
                                </button>
                                <ExportButton
                                    data={content.map(item => ({
                                        Name: item.name,
                                        Type: item.type,
                                        Size: `${(item.metadata.size / 1024).toFixed(1)} KB`,
                                        Duration: `${item.duration}s`,
                                        'Upload Date': new Date(item.metadata.uploadedAt).toLocaleDateString(),
                                        Filename: item.metadata.originalName,
                                    }))}
                                    filename="content_library"
                                    title="Content Library Export"
                                />
                            </div>
                        </div>

                        {/* Breadcrumbs */}
                        <Breadcrumbs path={breadcrumbPath} onNavigate={handleBreadcrumbNavigate} />

                        {/* Upload Zone */}
                        <div {...getRootProps()} className="relative group cursor-pointer">
                            <input {...getInputProps()} />
                            <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg opacity-10 group-hover:opacity-20 blur transition duration-500 ${isDragActive ? 'opacity-30' : ''}`}></div>
                            <div className={`relative flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed bg-white transition-all duration-300 ${isDragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                }`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                    <div className="p-2 rounded-full bg-blue-50 text-blue-600 mb-2 group-hover:scale-110 transition-transform duration-300">
                                        <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                                    </div>
                                    {uploading ? (
                                        <>
                                            <p className="mb-1 text-base text-gray-900 font-semibold">Uploading...</p>
                                            <p className="text-sm text-gray-500">Please wait</p>
                                        </>
                                    ) : isDragActive ? (
                                        <>
                                            <p className="mb-1 text-base text-gray-900 font-semibold">Drop files here</p>
                                            <p className="text-sm text-gray-500">Release to upload</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mb-0.5 text-sm text-gray-900 font-semibold">Drag & drop media here</p>
                                            <p className="text-xs text-gray-500">Supports JPG, PNG, MP4 <span className="text-gray-400">|</span> Max 100MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards - 4 in a row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Folders */}
                            <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Folders</span>
                                    <span className="material-symbols-outlined text-gray-400 text-[18px]">folder</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <span className="text-2xl font-bold text-gray-900">{folderCount}</span>
                                    <span className="text-xs text-emerald-600 font-medium">Active</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                                    <div className="bg-emerald-500 h-1 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                            </div>

                            {/* Images */}
                            <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Images</span>
                                    <span className="material-symbols-outlined text-yellow-500 text-[18px]">image</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <span className="text-2xl font-bold text-gray-900">{imageCount}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                                    <div className="bg-yellow-500 h-1 rounded-full" style={{ width: `${totalCount > 0 ? (imageCount / totalCount) * 100 : 0}%` }}></div>
                                </div>
                            </div>

                            {/* URLs */}
                            <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">URLs</span>
                                    <span className="material-symbols-outlined text-gray-400 text-[18px]">link</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <span className="text-2xl font-bold text-gray-900">{urlCount}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                                    <div className="bg-gray-400 h-1 rounded-full" style={{ width: `${totalCount > 0 ? (urlCount / totalCount) * 100 : 0}%` }}></div>
                                </div>
                            </div>

                            {/* Videos */}
                            <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Videos</span>
                                    <span className="material-symbols-outlined text-gray-400 text-[18px]">movie</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <span className="text-2xl font-bold text-gray-900">{videoCount}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                                    <div className="bg-gray-400 h-1 rounded-full" style={{ width: `${totalCount > 0 ? (videoCount / totalCount) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="flex flex-col md:flex-row gap-3">
                            {/* Search */}
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search by name, type, or URL..."
                                className="flex-1"
                            />

                            {/* Filters */}
                            <div className="flex gap-2">
                                <DateRangePicker
                                    value={dateRange}
                                    onChange={setDateRange}
                                />
                                <FilterDropdown
                                    label="Content Type"
                                    options={typeFilterOptions}
                                    value={typeFilters}
                                    onChange={setTypeFilters}
                                    icon="category"
                                />
                                <SortDropdown
                                    options={sortOptions}
                                    value={sortBy}
                                    onChange={setSortBy}
                                />
                            </div>
                        </div>

                        {/* Content Grid */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="text-xl">Loading content...</div>
                            </div>
                        ) : content.length === 0 ? (
                            <EmptyState
                                icon="palette"
                                title="No content yet"
                                description="Your library is looking a little empty. Upload your first image or video to get started creating amazing displays."
                                actionLabel="Upload Media"
                                onAction={() => {
                                    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                    if (input) input.click();
                                }}
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                                {content.map((item) => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={() => handleContentDragStart(item.id)}
                                        onDragEnd={handleContentDragEnd}
                                        onClick={(e) => {
                                            if (e.shiftKey || (e.target as HTMLElement).closest('.checkbox-area')) {
                                                e.stopPropagation();
                                                toggleSelection(item.id, e.shiftKey);
                                            } else {
                                                setPreviewMedia(item);
                                            }
                                        }}
                                        className={`group relative flex flex-col bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${draggedContent === item.id
                                            ? 'opacity-50 cursor-grabbing scale-95'
                                            : isSelected(item.id)
                                                ? 'border-blue-500 ring-2 ring-blue-300'
                                                : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        {/* Selection Checkbox */}
                                        <div
                                            className="checkbox-area absolute top-2 left-2 z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelection(item.id, e.shiftKey);
                                            }}
                                        >
                                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${isSelected(item.id)
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'bg-white/90 border-gray-400 hover:border-blue-500 backdrop-blur-sm'
                                                }`}>
                                                {isSelected(item.id) && (
                                                    <span className="material-symbols-outlined text-white text-[16px] fill-1">check</span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Thumbnail */}
                                        <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                            {item.metadata.thumbnail ? (
                                                <img
                                                    src={`http://localhost:3001${item.metadata.thumbnail}`}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-6xl text-gray-300">
                                                        {item.type === 'image' ? 'image' : item.type === 'video' ? 'movie' : 'link'}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Type badge */}
                                            <div className="absolute top-2 right-2 px-2 py-1 bg-gray-900/70 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px] text-blue-400">
                                                    {item.type === 'image' ? 'image' : item.type === 'video' ? 'videocam' : 'link'}
                                                </span>
                                                {item.type}
                                            </div>
                                            {item.type === 'video' && (
                                                <>
                                                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-gray-900/80 rounded text-[10px] font-medium text-white">
                                                        {item.duration}s
                                                    </div>
                                                    {/* Play overlay on hover */}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-white">play_arrow</span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className="p-4 flex flex-col flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-sm font-semibold text-gray-900 truncate pr-2 group-hover:text-blue-600 transition-colors">
                                                    {item.name}
                                                </h3>
                                                <button className="text-gray-400 hover:text-gray-700">
                                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                </button>
                                            </div>
                                            <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                                                <span>{formatFileSize(item.metadata.size)}</span>
                                                <span>{formatDate(item.metadata.uploadedAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* New Folder Modal */}
            <NewFolderModal
                isOpen={showNewFolderModal}
                onClose={() => setShowNewFolderModal(false)}
                onCreateFolder={handleCreateFolder}
                folders={(() => {
                    const flattenFolders = (folderList: Folder[]): Array<{ id: string; name: string; parent_id: string | null }> => {
                        const result: Array<{ id: string; name: string; parent_id: string | null }> = [];
                        if (!Array.isArray(folderList)) return result;
                        folderList.forEach(folder => {
                            result.push({ id: folder.id, name: folder.name, parent_id: folder.parent_id });
                            if (folder.children && Array.isArray(folder.children) && folder.children.length > 0) {
                                result.push(...flattenFolders(folder.children));
                            }
                        });
                        return result;
                    };
                    return flattenFolders(folders);
                })()}
                currentFolderId={selectedFolderId}
            />

            {/* URL Modal - Keeping existing implementation */}
            {showUrlModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setShowUrlModal(false)}
                >
                    <div
                        className="relative w-full max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Add URL Content</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Add an external URL to your content library</p>
                            </div>
                            <button
                                onClick={() => setShowUrlModal(false)}
                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/5"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleUrlSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    value={urlForm.name}
                                    onChange={(e) => setUrlForm({ ...urlForm, name: e.target.value })}
                                    className="block w-full px-4 py-3 border-none rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g., Menu Board - Location 1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    URL *
                                </label>
                                <input
                                    type="url"
                                    value={urlForm.url}
                                    onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                                    className="block w-full px-4 py-3 border-none rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="https://example.com/menu-board"
                                    required
                                />
                            </div>

                            {/* Non-stop Checkbox */}
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                                <input
                                    type="checkbox"
                                    id="isNonStop"
                                    checked={urlForm.isNonStop}
                                    onChange={(e) => setUrlForm({ ...urlForm, isNonStop: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
                                />
                                <label htmlFor="isNonStop" className="flex-1 cursor-pointer">
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Non-stop / Infinite Loop</div>
                                    <div className="text-xs text-slate-500">Display this URL continuously without rotation</div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Display Duration (seconds)
                                </label>
                                <input
                                    type="number"
                                    value={urlForm.duration}
                                    onChange={(e) => setUrlForm({ ...urlForm, duration: parseInt(e.target.value) })}
                                    className="block w-full px-4 py-3 border-none rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    min="1"
                                    max="3600"
                                    disabled={urlForm.isNonStop}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {urlForm.isNonStop ? 'Duration disabled for non-stop URLs' : 'How long to display this URL in playlists'}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUrlModal(false)}
                                    className="flex-1 px-5 h-11 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-5 h-11 rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-all text-sm font-medium shadow-lg shadow-purple-600/20"
                                >
                                    Add URL
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal - Keeping existing implementation with updated styling */}
            {selectedContent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
                    onClick={() => setSelectedContent(null)}
                >
                    <div
                        className="relative w-full max-w-4xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[95vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{selectedContent.name}</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Detailed preview</p>
                            </div>
                            <button
                                onClick={() => setSelectedContent(null)}
                                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/5"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden mb-6">
                                {selectedContent.type === 'image' ? (
                                    <img
                                        src={`http://localhost:3001${selectedContent.url}`}
                                        alt={selectedContent.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : selectedContent.type === 'video' ? (
                                    <video
                                        src={`http://localhost:3001${selectedContent.url}`}
                                        controls
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white">
                                        <div className="text-center">
                                            <span className="material-symbols-outlined text-6xl mb-4">link</span>
                                            <p className="text-sm">{selectedContent.url}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Metadata */}
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">File Metadata</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6 border-b border-slate-200 dark:border-slate-700 md:border-r">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Type</span>
                                    <span className="text-slate-900 dark:text-white text-sm font-medium capitalize">{selectedContent.type}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6 border-b border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Duration</span>
                                    <span className="text-slate-900 dark:text-white text-sm font-medium">{selectedContent.duration} seconds</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6 border-b border-slate-200 dark:border-slate-700 md:border-r">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Size</span>
                                    <span className="text-slate-900 dark:text-white text-sm font-medium">{formatFileSize(selectedContent.metadata.size)}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6 border-b border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Uploaded</span>
                                    <span className="text-slate-900 dark:text-white text-sm font-medium">{formatDate(selectedContent.metadata.uploadedAt)}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6 md:border-r">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Uploaded By</span>
                                    <span className="text-slate-900 dark:text-white text-sm font-medium">{selectedContent.uploaded_by || 'System'}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">MIME Type</span>
                                    <span className="text-slate-900 dark:text-white text-sm font-medium">{selectedContent.metadata.mimeType}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex flex-col-reverse sm:flex-row items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 rounded-b-xl gap-4">
                            <button
                                onClick={() => deleteContent(selectedContent.id)}
                                className="flex items-center justify-center gap-2 px-5 h-10 w-full sm:w-auto rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-sm font-semibold"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                Delete Media
                            </button>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => setSelectedContent(null)}
                                    className="px-5 h-10 w-full sm:w-auto rounded-lg text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all text-sm font-medium shadow-sm"
                                >
                                    Close
                                </button>
                                <button className="px-5 h-10 w-full sm:w-auto rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-all text-sm font-medium shadow-lg shadow-blue-500/20">
                                    Edit Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (() => {
                const findFolder = (folders: Folder[], id: string): Folder | null => {
                    for (const folder of folders) {
                        if (folder.id === id) return folder;
                        const found = findFolder(folder.children, id);
                        if (found) return found;
                    }
                    return null;
                };
                const folder = findFolder(folders, contextMenu.folderId);
                return (
                    <FolderContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        isSystemFolder={folder?.is_system === 1}
                        onClose={() => setContextMenu(null)}
                        onRename={() => {
                            setSelectedFolderForAction(contextMenu.folderId);
                            setShowRenameModal(true);
                        }}
                        onDelete={() => {
                            setSelectedFolderForAction(contextMenu.folderId);
                            setShowDeleteModal(true);
                        }}
                        onMove={() => {
                            setSelectedFolderForAction(contextMenu.folderId);
                            setShowMoveModal(true);
                        }}
                        onNewSubfolder={() => {
                            setSelectedFolderForAction(contextMenu.folderId);
                            setShowNewFolderModal(true);
                        }}
                    />
                );
            })()}

            {/* Rename Folder Modal */}
            {showRenameModal && selectedFolderForAction && (() => {
                const findFolder = (folders: Folder[], id: string): Folder | null => {
                    for (const folder of folders) {
                        if (folder.id === id) return folder;
                        const found = findFolder(folder.children, id);
                        if (found) return found;
                    }
                    return null;
                };
                const folder = findFolder(folders, selectedFolderForAction);
                return folder ? (
                    <RenameFolderModal
                        isOpen={showRenameModal}
                        onClose={() => {
                            setShowRenameModal(false);
                            setSelectedFolderForAction(null);
                        }}
                        folderId={folder.id}
                        currentName={folder.name}
                        onRename={handleRenameFolder}
                    />
                ) : null;
            })()}

            {/* Delete Folder Modal */}
            {showDeleteModal && selectedFolderForAction && (() => {
                const findFolder = (folders: Folder[], id: string): Folder | null => {
                    for (const folder of folders) {
                        if (folder.id === id) return folder;
                        const found = findFolder(folder.children, id);
                        if (found) return found;
                    }
                    return null;
                };
                const folder = findFolder(folders, selectedFolderForAction);
                return folder ? (
                    <DeleteFolderModal
                        isOpen={showDeleteModal}
                        onClose={() => {
                            setShowDeleteModal(false);
                            setSelectedFolderForAction(null);
                        }}
                        folderId={folder.id}
                        folderName={folder.name}
                        itemCount={folder.itemCount}
                        onDelete={handleDeleteFolder}
                    />
                ) : null;
            })()}

            {/* Move Folder Modal */}
            {showMoveModal && selectedFolderForAction && (() => {
                const findFolder = (folders: Folder[], id: string): Folder | null => {
                    for (const folder of folders) {
                        if (folder.id === id) return folder;
                        const found = findFolder(folder.children, id);
                        if (found) return found;
                    }
                    return null;
                };
                const folder = findFolder(folders, selectedFolderForAction);
                return folder ? (
                    <MoveFolderModal
                        isOpen={showMoveModal}
                        onClose={() => {
                            setShowMoveModal(false);
                            setSelectedFolderForAction(null);
                        }}
                        folderId={folder.id}
                        folderName={folder.name}
                        folders={folders}
                        onMove={handleMoveFolder}
                    />
                ) : null;
            })()}

            {/* Bulk Action Bar */}
            <BulkActionBar
                selectedCount={selectedCount}
                totalCount={content.length}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                onDelete={handleBulkDelete}
            />

            {/* Media Preview Modal */}
            <MediaPreviewModal
                isOpen={!!previewMedia}
                onClose={() => setPreviewMedia(null)}
                media={previewMedia}
            />
        </div>
    );
}
