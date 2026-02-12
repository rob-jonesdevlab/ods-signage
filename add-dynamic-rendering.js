#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// All pages that use authentication and need dynamic rendering
const authPages = [
    'dashboard/app/dashboard/page.tsx',
    'dashboard/app/analytics/page.tsx',
    'dashboard/app/content/page.tsx',
    'dashboard/app/network/page.tsx',
    'dashboard/app/operations/page.tsx',
    'dashboard/app/players/page.tsx',
    'dashboard/app/playlists/page.tsx',
    'dashboard/app/settings/page.tsx',
    'dashboard/app/settings/api/page.tsx',
    'dashboard/app/settings/billing/page.tsx',
    'dashboard/app/settings/notifications/page.tsx',
    'dashboard/app/settings/profile/page.tsx',
    'dashboard/app/settings/security/page.tsx',
    'dashboard/app/settings/team/page.tsx',
    'dashboard/app/playlists/[id]/page.tsx',
    'dashboard/app/players/pair/page.tsx',
];

console.log('🔧 Adding dynamic rendering configuration to authenticated pages...\n');

let successCount = 0;
let skippedCount = 0;

authPages.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        skippedCount++;
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Check if dynamic export already exists
        if (content.includes("export const dynamic")) {
            console.log(`⏭️  ${file} already has dynamic export`);
            skippedCount++;
            return;
        }

        // Find the position after 'use client' directive
        const lines = content.split('\n');
        let insertIndex = 0;

        // Find first non-directive, non-empty line (after 'use client')
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === "'use client';" || line === '"use client";') {
                insertIndex = i + 1;
                // Skip any blank lines after 'use client'
                while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
                    insertIndex++;
                }
                break;
            }
        }

        // Insert the dynamic export
        const dynamicExport = "\n// Force dynamic rendering for authenticated page\nexport const dynamic = 'force-dynamic';\n";
        lines.splice(insertIndex, 0, dynamicExport);

        content = lines.join('\n');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Added dynamic export to ${file}`);
        successCount++;
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Modified: ${successCount} files`);
console.log(`   ⏭️  Skipped: ${skippedCount} files`);
console.log(`\n✅ Permanent solution implemented!`);
console.log(`\nThis configures Next.js to use dynamic rendering (SSR/CSR) instead of`);
console.log(`static generation (SSG) for authenticated pages. This is the official`);
console.log(`Next.js 14 approach for pages that require runtime data.`);
