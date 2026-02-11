const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../ods-signage.db');

async function migrate() {
    console.log('🚀 Starting Beta State Push SQLite migration...\n');
    console.log('📋 Hybrid Architecture:');
    console.log('   - Supabase: organizations, users, tech_assignments, audit_logs');
    console.log('   - SQLite: players, content, playlists, groups, templates, analytics\n');

    const SQL = await initSqlJs();

    if (!fs.existsSync(dbPath)) {
        console.error('❌ Database not found at:', dbPath);
        process.exit(1);
    }

    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    try {
        // 1. Create player_groups table
        console.log('📦 Creating player_groups table...');
        db.run(`
      CREATE TABLE IF NOT EXISTS player_groups (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        location TEXT,
        timezone TEXT DEFAULT 'UTC',
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ player_groups table created\n');

        // 2. Create playlist_templates table
        console.log('📦 Creating playlist_templates table...');
        db.run(`
      CREATE TABLE IF NOT EXISTS playlist_templates (
        id TEXT PRIMARY KEY,
        organization_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        thumbnail TEXT,
        is_public INTEGER DEFAULT 0,
        template_data TEXT NOT NULL,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ playlist_templates table created\n');

        // 3. Create player_analytics table
        console.log('📦 Creating player_analytics table...');
        db.run(`
      CREATE TABLE IF NOT EXISTS player_analytics (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        date DATE NOT NULL,
        uptime_minutes INTEGER DEFAULT 0,
        offline_incidents INTEGER DEFAULT 0,
        content_plays INTEGER DEFAULT 0,
        bandwidth_mb REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, date),
        FOREIGN KEY (player_id) REFERENCES players(id)
      );
    `);
        db.run(`CREATE INDEX IF NOT EXISTS idx_player_analytics_date ON player_analytics(organization_id, date DESC);`);
        console.log('✅ player_analytics table created\n');

        // 4. Modify players table
        console.log('📝 Modifying players table...');
        const playerColumns = db.exec("PRAGMA table_info(players);");
        const existingPlayerColumns = playerColumns[0]?.values.map(row => row[1]) || [];

        if (!existingPlayerColumns.includes('organization_id')) {
            db.run(`ALTER TABLE players ADD COLUMN organization_id TEXT;`);
            console.log('  ✅ Added organization_id column');
        }

        if (!existingPlayerColumns.includes('group_id')) {
            db.run(`ALTER TABLE players ADD COLUMN group_id TEXT;`);
            console.log('  ✅ Added group_id column');
        }
        console.log('✅ players table modified\n');

        // 5. Modify content table
        console.log('📝 Modifying content table...');
        const contentColumns = db.exec("PRAGMA table_info(content);");
        const existingContentColumns = contentColumns[0]?.values.map(row => row[1]) || [];

        if (!existingContentColumns.includes('organization_id')) {
            db.run(`ALTER TABLE content ADD COLUMN organization_id TEXT;`);
            console.log('  ✅ Added organization_id column');
        }
        console.log('✅ content table modified\n');

        // 6. Modify playlists table
        console.log('📝 Modifying playlists table...');
        const playlistColumns = db.exec("PRAGMA table_info(playlists);");
        const existingPlaylistColumns = playlistColumns[0]?.values.map(row => row[1]) || [];

        if (!existingPlaylistColumns.includes('organization_id')) {
            db.run(`ALTER TABLE playlists ADD COLUMN organization_id TEXT;`);
            console.log('  ✅ Added organization_id column');
        }
        console.log('✅ playlists table modified\n');

        // Save database
        const data = db.export();
        fs.writeFileSync(dbPath, data);
        console.log('💾 Database saved\n');

        // Verify tables
        console.log('🔍 Verifying tables...');
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
        const tableNames = tables[0]?.values.map(row => row[0]) || [];

        const requiredTables = ['player_groups', 'playlist_templates', 'player_analytics'];
        const missingTables = requiredTables.filter(t => !tableNames.includes(t));

        if (missingTables.length > 0) {
            console.error('❌ Missing tables:', missingTables.join(', '));
            process.exit(1);
        }

        console.log('✅ All tables verified\n');
        console.log('🎉 SQLite migration completed successfully!\n');
        console.log('📋 Created tables:');
        requiredTables.forEach(table => console.log(`   - ${table}`));
        console.log('\n📝 Modified tables:');
        console.log('   - players (added: organization_id, group_id)');
        console.log('   - content (added: organization_id)');
        console.log('   - playlists (added: organization_id)');
        console.log('\n⚠️  Next step: Run Supabase migration for organizations, users, tech_assignments, audit_logs');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        db.close();
    }
}

migrate().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
