const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not found in environment');
}

const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

/**
 * Sync local SQLite data to Supabase
 * @param {string} table - Table name
 * @param {Array} data - Data to sync
 */
async function syncToSupabase(table, data) {
    if (!supabase) {
        console.warn('Supabase not configured, skipping sync');
        return;
    }

    try {
        const { data: result, error } = await supabase
            .from(table)
            .upsert(data, { onConflict: 'id' });

        if (error) throw error;

        console.log(`✅ Synced ${data.length} records to Supabase table: ${table}`);
        return result;
    } catch (error) {
        console.error(`❌ Error syncing to Supabase:`, error.message);
        throw error;
    }
}

/**
 * Fetch data from Supabase
 * @param {string} table - Table name
 * @param {Object} filters - Optional filters
 */
async function fetchFromSupabase(table, filters = {}) {
    if (!supabase) {
        console.warn('Supabase not configured');
        return [];
    }

    try {
        let query = supabase.from(table).select('*');

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        const { data, error } = await query;

        if (error) throw error;

        return data;
    } catch (error) {
        console.error(`❌ Error fetching from Supabase:`, error.message);
        throw error;
    }
}

/**
 * Set up real-time subscription
 * @param {string} table - Table name
 * @param {Function} callback - Callback for changes
 */
function subscribeToChanges(table, callback) {
    if (!supabase) {
        console.warn('Supabase not configured');
        return null;
    }

    const subscription = supabase
        .channel(`${table}_changes`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table },
            callback
        )
        .subscribe();

    console.log(`📡 Subscribed to ${table} changes`);

    return subscription;
}

/**
 * Initialize Supabase tables (create if not exist)
 */
async function initializeSupabaseTables() {
    if (!supabase) {
        console.warn('Supabase not configured, skipping table initialization');
        return;
    }

    console.log('🔧 Initializing Supabase tables...');

    // Note: Tables should be created via Supabase dashboard or migrations
    // This function just checks if they exist

    const tables = ['players', 'content', 'playlists'];

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('count')
                .limit(1);

            if (error && error.code === '42P01') {
                console.log(`⚠️  Table '${table}' does not exist in Supabase`);
                console.log(`   Create it via Supabase dashboard or run migrations`);
            } else {
                console.log(`✅ Table '${table}' exists`);
            }
        } catch (error) {
            console.error(`Error checking table ${table}:`, error.message);
        }
    }
}

module.exports = {
    supabase,
    syncToSupabase,
    fetchFromSupabase,
    subscribeToChanges,
    initializeSupabaseTables
};
