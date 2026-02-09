const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'ods-signage.db');
let db;

// Initialize SQL.js database
async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('✅ Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('✅ Created new database');
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cpu_serial TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'offline',
      last_seen DATETIME,
      config TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT,
      duration INTEGER DEFAULT 10,
      metadata TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      items TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database tables created');

  // Run migrations for Phase 1: Folder/Playlist Architecture
  runMigrations();

  // Save database to disk
  saveDatabase();

  return db;
}

// Migration function for Phase 1
function runMigrations() {
  console.log('🔄 Running database migrations...');

  // Create folders table
  db.run(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      is_system INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Create folder_content junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS folder_content (
      id TEXT PRIMARY KEY,
      folder_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(folder_id, content_id)
    );
  `);

  // Create playlists table (new structure, different from old playlists table)
  db.run(`
    CREATE TABLE IF NOT EXISTS playlists_v2 (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_by TEXT DEFAULT 'System',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Create playlist_content junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS playlist_content (
      id TEXT PRIMARY KEY,
      playlist_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(playlist_id, content_id)
    );
  `);

  // Create playlist_assets table (Asset Directory)
  db.run(`
    CREATE TABLE IF NOT EXISTS playlist_assets (
      id TEXT PRIMARY KEY,
      playlist_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      added_at TEXT NOT NULL,
      UNIQUE(playlist_id, content_id)
    );
  `);
  console.log('✅ Created playlist_assets table (Asset Directory)');

  // Create player_groups table
  db.run(`
    CREATE TABLE IF NOT EXISTS player_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Check if uploaded_by column exists in content table
  const contentColumns = db.exec("PRAGMA table_info(content)");
  const hasUploadedBy = contentColumns[0]?.values.some(col => col[1] === 'uploaded_by');

  if (!hasUploadedBy) {
    db.run("ALTER TABLE content ADD COLUMN uploaded_by TEXT DEFAULT 'System'");
    console.log('✅ Added uploaded_by column to content table');
  }

  // Check if group_id and playlist_id columns exist in players table
  const playerColumns = db.exec("PRAGMA table_info(players)");
  const hasGroupId = playerColumns[0]?.values.some(col => col[1] === 'group_id');
  const hasPlaylistId = playerColumns[0]?.values.some(col => col[1] === 'playlist_id');

  if (!hasGroupId) {
    db.run('ALTER TABLE players ADD COLUMN group_id TEXT');
    console.log('✅ Added group_id column to players table');
  }
  if (!hasPlaylistId) {
    db.run('ALTER TABLE players ADD COLUMN playlist_id TEXT');
    console.log('✅ Added playlist_id column to players table');
  }

  // Phase 2: Device Pairing System Migration
  const hasPairingCode = playerColumns[0]?.values.some(col => col[1] === 'pairing_code');
  const hasAccountId = playerColumns[0]?.values.some(col => col[1] === 'account_id');
  const hasPairedAt = playerColumns[0]?.values.some(col => col[1] === 'paired_at');
  const hasPairingCodeExpiresAt = playerColumns[0]?.values.some(col => col[1] === 'pairing_code_expires_at');
  const hasDeviceUuid = playerColumns[0]?.values.some(col => col[1] === 'device_uuid');

  if (!hasPairingCode) {
    db.run("ALTER TABLE players ADD COLUMN pairing_code TEXT");
    console.log('✅ Added pairing_code column to players table');
  }

  if (!hasAccountId) {
    db.run("ALTER TABLE players ADD COLUMN account_id TEXT");
    console.log('✅ Added account_id column to players table');
  }

  if (!hasPairedAt) {
    db.run("ALTER TABLE players ADD COLUMN paired_at DATETIME");
    console.log('✅ Added paired_at column to players table');
  }

  if (!hasPairingCodeExpiresAt) {
    db.run("ALTER TABLE players ADD COLUMN pairing_code_expires_at DATETIME");
    console.log('✅ Added pairing_code_expires_at column to players table');
  }

  if (!hasDeviceUuid) {
    db.run("ALTER TABLE players ADD COLUMN device_uuid TEXT");
    console.log('✅ Added device_uuid column to players table');
  }


  // Create System folder if it doesn't exist
  const { v4: uuidv4 } = require('uuid');
  const systemFolder = db.exec("SELECT id FROM folders WHERE name = 'System' AND is_system = 1");

  if (!systemFolder[0] || systemFolder[0].values.length === 0) {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.run(
      "INSERT INTO folders (id, name, parent_id, is_system, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, 'System', null, 1, now, now]
    );
    console.log('✅ Created System folder');
  }

  console.log('✅ Migrations completed');
}

// Save database to disk
function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Wrapper functions to match better-sqlite3 API
const dbWrapper = {
  prepare: (sql) => {
    return {
      run: (...params) => {
        db.run(sql, params);
        saveDatabase();
        return { changes: db.getRowsModified() };
      },
      get: (...params) => {
        const stmt = db.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        const result = stmt.step() ? stmt.getAsObject() : undefined;
        stmt.free();
        return result;
      },
      all: (...params) => {
        const stmt = db.prepare(sql);
        // sql.js bind() expects an array, not spread parameters
        if (params.length > 0) {
          stmt.bind(params);
        }
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  },
  exec: (sql) => {
    db.run(sql);
    saveDatabase();
  }
};

// Initialize and export
let dbPromise = initDatabase().then(() => dbWrapper);

module.exports = dbPromise;
