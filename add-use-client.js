#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToFix = [
    'dashboard/app/dashboard/page.tsx',
    'dashboard/app/settings/notifications/page.tsx',
    'dashboard/app/settings/team/page.tsx',
    'dashboard/app/settings/profile/page.tsx',
    'dashboard/app/settings/security/page.tsx',
    'dashboard/app/settings/api/page.tsx',
    'dashboard/app/settings/billing/page.tsx',
    'dashboard/app/players/pair/page.tsx',
];

console.log('🔧 Adding "use client" directive to pages...\n');

filesToFix.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Check if 'use client' is already present
        if (content.includes("'use client'") || content.includes('"use client"')) {
            console.log(`⏭️  ${file} already has 'use client'`);
            return;
        }

        // Add 'use client' at the top
        content = "'use client';\n\n" + content;

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Added 'use client' to ${file}`);
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log('\n✅ Done!');
