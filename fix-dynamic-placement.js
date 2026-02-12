#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pages that had the dynamic export inserted incorrectly
const filesToFix = [
    'dashboard/app/settings/api/page.tsx',
    'dashboard/app/settings/billing/page.tsx',
    'dashboard/app/settings/security/page.tsx',
    'dashboard/app/settings/team/page.tsx',
];

console.log('🔧 Fixing dynamic export placement...\n');

filesToFix.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Remove the incorrectly placed dynamic export and comment
        content = content.replace(/\n\/\/ Force dynamic rendering for authenticated page\nexport const dynamic = 'force-dynamic';\n/g, '');

        // Find 'use client' and add dynamic export after it
        const lines = content.split('\n');
        let newLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            newLines.push(lines[i]);

            // After 'use client', add the dynamic export
            if (line === "'use client';" || line === "'use client'" || line === '"use client";' || line === '"use client"') {
                newLines.push('');
                newLines.push('// Force dynamic rendering for authenticated page');
                newLines.push("export const dynamic = 'force-dynamic';");
            }
        }

        content = newLines.join('\n');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed ${file}`);
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log(`\n✅ Dynamic export placement fixed!`);
