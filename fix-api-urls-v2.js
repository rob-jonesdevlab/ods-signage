#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing API URL syntax errors...\n');

// Fix broken template strings in all TypeScript files
const dashboardDir = path.join(__dirname, 'dashboard');

try {
    // Fix pattern 1: `${API_URL}...') -> `${API_URL}...`)
    execSync(`find "${dashboardDir}" -type f \\( -name "*.tsx" -o -name "*.ts" \\) -exec sed -i '' "s/\\\`\\$\{API_URL\}\\([^']*\\)'/\\\`\\$\{API_URL\}\\1\\\`/g" {} +`, { stdio: 'inherit' });
    console.log('✅ Fixed template string closing quotes\n');

    // Fix pattern 2: Remaining 'http://localhost:3001 -> `${API_URL}
    execSync(`find "${dashboardDir}" -type f \\( -name "*.tsx" -o -name "*.ts" \\) -exec sed -i '' "s/'http:\\/\\/localhost:3001/\\\`\\$\{API_URL\}/g" {} +`, { stdio: 'inherit' });
    console.log('✅ Replaced remaining hardcoded localhost URLs\n');

    // Fix pattern 3: "http://localhost:3001 -> `${API_URL}
    execSync(`find "${dashboardDir}" -type f \\( -name "*.tsx" -o -name "*.ts" \\) -exec sed -i '' 's/"http:\\/\\/localhost:3001/\\\`\\$\{API_URL\}/g' {} +`, { stdio: 'inherit' });
    console.log('✅ Replaced double-quoted localhost URLs\n');

    console.log('✅ All syntax errors fixed!\n');
    console.log('Next steps:');
    console.log('  1. Review changes: git diff');
    console.log('  2. Test build: cd dashboard && npm run build');
    console.log('  3. Commit & push: git add -A && git commit -m "fix: API URL template string syntax" && git push');
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
