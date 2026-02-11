const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../ods-signage.db');

async function migrate() {
    console.log('🚀 Starting Beta State Push migration...\n');

    const SQL = await initSqlJs();

    // Load existing database
    if (!fs.existsSync(dbPath)) {
        console.error('❌ Database not found at:', dbPath);
        process.exit(1);
    }

    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    try {
        // 1. Create organizations table
        console.log('📦 Creating organizations table...');
        db.run(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        branding_logo TEXT,
        branding_primary_color TEXT DEFAULT '#3B82F6',
        branding_secondary_color TEXT DEFAULT '#6366F1',
        plan_tier TEXT DEFAULT 'free',
        max_players INTEGER DEFAULT 5,
        max_users INTEGER DEFAULT 3,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ organizations table created\n');

        // 2. Create tech_assignments table
        console.log('📦 Creating tech_assignments table...');
        db.run(`
      CREATE TABLE IF NOT EXISTS tech_assignments (
        id TEXT PRIMARY KEY,
        tech_user_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        assigned_by TEXT,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tech_user_id, organization_id),
        FOREIGN KEY (tech_user_id) REFERENCES users(id),
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (assigned_by) REFERENCES users(id)
      );
    `);
        db.run(`CREATE INDEX IF NOT EXISTS idx_tech_assignments_tech ON tech_assignments(tech_user_id);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_tech_assignments_org ON tech_assignments(organization_id);`);
        console.log('✅ tech_assignments table created\n');

        // 3. Create player_groups table
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);
        console.log('✅ player_groups table created\n');

        // 4. Create playlist_templates table
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);
        console.log('✅ playlist_templates table created\n');

        // 5. Create audit_logs table
        console.log('📦 Creating audit_logs table...');
        db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        user_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        changes TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
        db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);`);
        console.log('✅ audit_logs table created\n');

        // 6. Create player_analytics table
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
        FOREIGN KEY (player_id) REFERENCES players(id),
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
      );
    `);
        db.run(`CREATE INDEX IF NOT EXISTS idx_player_analytics_date ON player_analytics(organization_id, date DESC);`);
        console.log('✅ player_analytics table created\n');

        // 7. Modify users table
        console.log('📝 Modifying users table...');

        // Check if columns already exist
        const userColumns = db.exec("PRAGMA table_info(users);");
        const existingColumns = userColumns[0]?.values.map(row => row[1]) || [];

        if (!existingColumns.includes('organization_id')) {
            db.run(`ALTER TABLE users ADD COLUMN organization_id TEXT;`);
            console.log('  ✅ Added organization_id column');
        }

        if (!existingColumns.includes('role')) {
            db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'viewer';`);
            console.log('  ✅ Added role column');
        }

        if (!existingColumns.includes('is_active')) {
            db.run(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;`);
            console.log('  ✅ Added is_active column');
        }

        if (!existingColumns.includes('last_login_at')) {
            db.run(`ALTER TABLE users ADD COLUMN last_login_at DATETIME;`);
            console.log('  ✅ Added last_login_at column');
        }
        console.log('✅ users table modified\n');

        // 8. Modify players table
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

        // Note: config column already exists in the schema
        console.log('✅ players table modified\n');

        // Save database
        const data = db.export();
        fs.writeFileSync(dbPath, data);
        console.log('💾 Database saved\n');

        // Verify tables
        console.log('🔍 Verifying tables...');
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
        const tableNames = tables[0]?.values.map(row => row[0]) || [];

        const requiredTables = [
            'organizations',
            'tech_assignments',
            'player_groups',
            'playlist_templates',
            'audit_logs',
            'player_analytics'
        ];

        const missingTables = requiredTables.filter(t => !tableNames.includes(t));

        if (missingTables.length > 0) {
            console.error('❌ Missing tables:', missingTables.join(', '));
            process.exit(1);
        }

        console.log('✅ All tables verified\n');
        console.log('🎉 Migration completed successfully!\n');
        console.log('📋 Created tables:');
        requiredTables.forEach(table => console.log(`   - ${table}`));
        console.log('\n📝 Modified tables:');
        console.log('   - users (added: organization_id, role, is_active, last_login_at)');
        console.log('   - players (added: organization_id, group_id)');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Run migration
migrate().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
