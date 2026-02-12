#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, 'dashboard');

// Files to update (app pages and components)
const filesToUpdate = [
    'dashboard/app/dashboard/page.tsx',
    'dashboard/app/analytics/page.tsx',
    'dashboard/app/network/page.tsx',
    'dashboard/app/content/page.tsx',
    'dashboard/app/operations/page.tsx',
    'dashboard/app/playlists/page.tsx',
    'dashboard/app/players/page.tsx',
    'dashboard/app/playlists/[id]/page.tsx',
    'dashboard/components/PairDeviceModal.tsx',
    'dashboard/components/AddContentModal.tsx',
    'dashboard/components/MediaPreviewModal.tsx',
];

function addApiImport(content, fileName) {
    // Check if API_URL is already imported
    if (content.includes("import { API_URL }")) {
        return content;
    }

    // Find the line after 'use client' or first import
    const lines = content.split('\n');
    let insertIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("'use client'") || lines[i].includes('"use client"')) {
            insertIndex = i + 1;
            break;
        }
        if (lines[i].startsWith('import ')) {
            insertIndex = i;
            break;
        }
    }

    lines.splice(insertIndex, 0, "import { API_URL } from '@/lib/api';");
    return lines.join('\n');
}

function replaceApiUrls(content) {
    // Replace 'http://localhost:3001 with ${API_URL}
    return content.replace(/'http:\/\/localhost:3001/g, '`${API_URL}')
        .replace(/`\$\{API_URL\}([^`]*)`/g, '`${API_URL}$1`');
}

console.log('Fixing API URLs in dashboard files...\n');

filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Add import if needed
        content = addApiImport(content, file);

        // Replace URLs
        const originalContent = content;
        content = replaceApiUrls(content);

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Fixed ${file}`);
        } else {
            console.log(`⏭️  No changes needed for ${file}`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log('\n✅ Done!');
