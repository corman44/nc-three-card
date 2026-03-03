const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, '../../data/game.db');
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        wins INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_played DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

/**
 * Get player stats by username
 */
function getPlayerStats(username) {
    const stmt = db.prepare('SELECT * FROM players WHERE username = ?');
    return stmt.get(username);
}

/**
 * Create new player or return existing
 */
function ensurePlayer(username) {
    const existing = getPlayerStats(username);
    if (existing) {
        return existing;
    }

    const stmt = db.prepare('INSERT INTO players (username) VALUES (?)');
    const result = stmt.run(username);
    return getPlayerStats(username);
}

/**
 * Increment win count for a player
 */
function incrementWin(username) {
    ensurePlayer(username);

    const stmt = db.prepare(`
        UPDATE players
        SET wins = wins + 1,
            games_played = games_played + 1,
            last_played = CURRENT_TIMESTAMP
        WHERE username = ?
    `);

    stmt.run(username);
    return getPlayerStats(username);
}

/**
 * Increment games played (for players who didn't win)
 */
function incrementGamesPlayed(username) {
    ensurePlayer(username);

    const stmt = db.prepare(`
        UPDATE players
        SET games_played = games_played + 1,
            last_played = CURRENT_TIMESTAMP
        WHERE username = ?
    `);

    stmt.run(username);
    return getPlayerStats(username);
}

/**
 * Get leaderboard (top players by wins)
 */
function getLeaderboard(limit = 10) {
    const stmt = db.prepare(`
        SELECT username, wins, games_played, last_played
        FROM players
        WHERE games_played > 0
        ORDER BY wins DESC, games_played ASC
        LIMIT ?
    `);

    return stmt.all(limit);
}

/**
 * Get all player stats
 */
function getAllPlayers() {
    const stmt = db.prepare('SELECT * FROM players ORDER BY wins DESC');
    return stmt.all();
}

module.exports = {
    db,
    getPlayerStats,
    ensurePlayer,
    incrementWin,
    incrementGamesPlayed,
    getLeaderboard,
    getAllPlayers
};
