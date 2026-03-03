const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Game = require('../game/Game');
const { incrementWin, incrementGamesPlayed, getPlayerStats } = require('../database/db');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3333;

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));

// Game storage
const games = new Map();
const playerSockets = new Map(); // playerId -> socket.id
const socketPlayers = new Map(); // socket.id -> { playerId, gameId }

/**
 * Create a new game
 */
function createGame(playerCount = 4) {
    const gameId = uuidv4();
    const game = new Game(gameId, playerCount);
    games.set(gameId, game);
    return game;
}

/**
 * Get game by ID
 */
function getGame(gameId) {
    return games.get(gameId);
}

/**
 * Record game results in database
 */
function recordGameResults(game) {
    if (!game.gameEnded || game.resultsRecorded) return;

    // Mark results as recorded to prevent duplicates
    game.resultsRecorded = true;

    // Find the winner (player with finishPosition === 1)
    const winner = game.players.find(p => p.finishPosition === 1);

    if (winner) {
        // Increment win count for winner
        incrementWin(winner.name);
        console.log(`Player ${winner.name} won! Recording victory.`);
    }

    // Increment games_played for all other players
    game.players.forEach(player => {
        if (player.id !== winner?.id) {
            incrementGamesPlayed(player.name);
            console.log(`Recording game played for ${player.name}`);
        }
    });
}

/**
 * Broadcast game state to all players in a game
 */
function broadcastGameState(gameId) {
    const game = getGame(gameId);
    if (!game) return;

    // Record game results if game has ended
    if (game.gameEnded) {
        recordGameResults(game);
    }

    for (const player of game.players) {
        const socketId = playerSockets.get(player.id);
        if (socketId) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('gameState', game.getGameState(player.id));
            }
        }
    }
}

/**
 * Socket.IO connection handling
 */
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    /**
     * Get list of available games (not started yet)
     */
    socket.on('getAvailableGames', (callback) => {
        try {
            const availableGames = [];

            for (const [gameId, game] of games.entries()) {
                if (!game.gameStarted) {
                    availableGames.push({
                        gameId: gameId,
                        playerCount: game.players.length,
                        maxPlayers: game.maxPlayers,
                        players: game.players.map(p => p.name)
                    });
                }
            }

            callback({ success: true, games: availableGames });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Create a new game
     */
    socket.on('createGame', (data, callback) => {
        try {
            const { playerName, playerCount } = data;
            const game = createGame(playerCount || 4);
            const playerId = uuidv4();

            // Add creator as first player
            game.addPlayer(playerId, playerName);

            // Track socket
            playerSockets.set(playerId, socket.id);
            socketPlayers.set(socket.id, { playerId, gameId: game.gameId });

            callback({
                success: true,
                gameId: game.gameId,
                playerId: playerId,
                gameState: game.getGameState(playerId)
            });

            console.log(`Game created: ${game.gameId} by ${playerName}`);
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Join an existing game
     */
    socket.on('joinGame', (data, callback) => {
        try {
            const { gameId, playerName } = data;
            const game = getGame(gameId);

            if (!game) {
                throw new Error('Game not found');
            }

            const playerId = uuidv4();
            game.addPlayer(playerId, playerName);

            // Track socket
            playerSockets.set(playerId, socket.id);
            socketPlayers.set(socket.id, { playerId, gameId });

            callback({
                success: true,
                playerId: playerId,
                gameState: game.getGameState(playerId)
            });

            // Notify all players
            broadcastGameState(gameId);

            console.log(`${playerName} joined game: ${gameId}`);
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Start the game
     */
    socket.on('startGame', (data, callback) => {
        try {
            const playerInfo = socketPlayers.get(socket.id);
            if (!playerInfo) {
                throw new Error('Player not found');
            }

            const game = getGame(playerInfo.gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            game.startGame();

            callback({ success: true });

            // Broadcast to all players
            broadcastGameState(playerInfo.gameId);

            console.log(`Game started: ${playerInfo.gameId}`);
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Play cards
     */
    socket.on('playCards', (data, callback) => {
        try {
            const playerInfo = socketPlayers.get(socket.id);
            if (!playerInfo) {
                throw new Error('Player not found');
            }

            const game = getGame(playerInfo.gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            const { cardIndices, zone } = data;
            const result = game.playCards(playerInfo.playerId, cardIndices, zone);

            callback({ success: true, result });

            // Broadcast updated state
            broadcastGameState(playerInfo.gameId);

        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Pick up pile
     */
    socket.on('pickUpPile', (data, callback) => {
        try {
            const playerInfo = socketPlayers.get(socket.id);
            if (!playerInfo) {
                throw new Error('Player not found');
            }

            const game = getGame(playerInfo.gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            const { faceUpIndex } = data || {};
            const result = game.pickUpPile(playerInfo.playerId, faceUpIndex);

            callback({ success: true, result });

            // Broadcast updated state
            broadcastGameState(playerInfo.gameId);

        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Get current game state
     */
    socket.on('getGameState', (callback) => {
        try {
            const playerInfo = socketPlayers.get(socket.id);
            if (!playerInfo) {
                throw new Error('Player not found');
            }

            const game = getGame(playerInfo.gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            callback({
                success: true,
                gameState: game.getGameState(playerInfo.playerId)
            });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Send chat message
     */
    socket.on('sendChat', (data, callback) => {
        try {
            const playerInfo = socketPlayers.get(socket.id);
            if (!playerInfo) {
                throw new Error('Player not found');
            }

            const game = getGame(playerInfo.gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            const player = game.players.find(p => p.id === playerInfo.playerId);
            if (!player) {
                throw new Error('Player not in game');
            }

            const chatMessage = {
                playerId: player.id,
                playerName: player.name,
                message: data.message,
                timestamp: Date.now()
            };

            // Broadcast chat message to all players in the game
            for (const p of game.players) {
                const socketId = playerSockets.get(p.id);
                if (socketId) {
                    const playerSocket = io.sockets.sockets.get(socketId);
                    if (playerSocket) {
                        playerSocket.emit('chatMessage', chatMessage);
                    }
                }
            }

            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Get player stats
     */
    socket.on('getPlayerStats', (data, callback) => {
        try {
            const { username } = data;
            if (!username) {
                throw new Error('Username required');
            }

            const stats = getPlayerStats(username);
            callback({ success: true, stats });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);

        const playerInfo = socketPlayers.get(socket.id);
        if (playerInfo) {
            const { playerId, gameId } = playerInfo;

            // Clean up
            playerSockets.delete(playerId);
            socketPlayers.delete(socket.id);

            // Optionally: remove player from game or mark as disconnected
            // For now, we'll keep them in the game
        }
    });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`Three Card Game server running on http://localhost:${PORT}`);
});
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Game = require('../game/Game');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3333;

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));

// Game storage
const games = new Map();
const playerSockets = new Map(); // playerId -> socket.id
const socketPlayers = new Map(); // socket.id -> { playerId, gameId }

/**
 * Create a new game
 */
function createGame(playerCount = 4) {
    const gameId = uuidv4();
    const game = new Game(gameId, playerCount);
    games.set(gameId, game);
    return game;
}

/**
 * Get game by ID
 */
function getGame(gameId) {
    return games.get(gameId);
}

/**
 * Broadcast game state to all players in a game
 */
function broadcastGameState(gameId) {
    const game = getGame(gameId);
    if (!game) return;

    for (const player of game.players) {
        const socketId = playerSockets.get(player.id);
        if (socketId) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('gameState', game.getGameState(player.id));
            }
        }
    }
}

/**
 * Socket.IO connection handling
 */
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    /**
     * Get list of available games (not started yet)
     */
    socket.on('getAvailableGames', (callback) => {
        try {
            const availableGames = [];

            for (const [gameId, game] of games.entries()) {
                if (!game.gameStarted) {
                    availableGames.push({
                        gameId: gameId,
                        playerCount: game.players.length,
                        maxPlayers: game.maxPlayers,
                        players: game.players.map(p => p.name)
                    });
                }
            }

            callback({ success: true, games: availableGames });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Create a new game
     */
    socket.on('createGame', (data, callback) => {
        try {
            const { playerName, playerCount } = data;
            const game = createGame(playerCount || 4);
            const playerId = uuidv4();

            // Add creator as first player
            game.addPlayer(playerId, playerName);

            // Track socket
            playerSockets.set(playerId, socket.id);
            socketPlayers.set(socket.id, { playerId, gameId: game.gameId });

            callback({
                success: true,
                gameId: game.gameId,
                playerId: playerId,
                gameState: game.getGameState(playerId)
            });

            console.log(`Game created: ${game.gameId} by ${playerName}`);
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Join an existing game
     */
    socket.on('joinGame', (data, callback) => {
        try {
            const { gameId, playerName } = data;
            const game = getGame(gameId);

            if (!game) {
                throw new Error('Game not found');
            }

            const playerId = uuidv4();
            game.addPlayer(playerId, playerName);

            // Track socket
            playerSockets.set(playerId, socket.id);
            socketPlayers.set(socket.id, { playerId, gameId });

            callback({
                success: true,
                playerId: playerId,
                gameState: game.getGameState(playerId)
            });

            // Notify all players
            broadcastGameState(gameId);

            console.log(`${playerName} joined game: ${gameId}`);
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Start the game
     */
    socket.on('startGame', (data, callback) => {
        try {
            const playerInfo = socketPlayers.get(socket.id);
            if (!playerInfo) {
                throw new Error('Player not found');
            }

            const game = getGame(playerInfo.gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            game.startGame();

            callback({ success: true });

            // Broadcast to all players
            broadcastGameState(playerInfo.gameId);

            console.log(`Game started: ${playerInfo.gameId}`);
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Play cards
     */
    socket.on('playCards', (data, callback) => {
        try {
            const playerInfo = socketPlayers.get(socket.id);
            if (!playerInfo) {
                throw new Error('Player not found');
            }

            const game = getGame(playerInfo.gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            const { cardIndices, zone } = data;
            const result = game.playCards(playerInfo.playerId, cardIndices, zone);

            callback({ success: true, result });

            // Broadcast special effects to all players
            if (result && (result.blowUp || result.extraTurn)) {
                const player = game.players.find(p => p.id === playerInfo.playerId);
                const effectData = {
                    playerId: playerInfo.playerId,
                    playerName: player ? player.name : 'Unknown',
                    blowUp: result.blowUp || false,
                    extraTurn: result.extraTurn || false
                };

                for (const p of game.players) {
                    const socketId = playerSockets.get(p.id);
                    if (socketId) {
                        const playerSocket = io.sockets.sockets.get(socketId);
                        if (playerSocket) {
                            playerSocket.emit('specialEffect', effectData);
                        }
                    }
                }
            }

            // Broadcast updated state
            broadcastGameState(playerInfo.gameId);

        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Pick up pile
     */
    socket.on('pickUpPile', (data, callback) => {
        try {
            const playerInfo = socketPlayers.get(socket.id);
            if (!playerInfo) {
                throw new Error('Player not found');
            }

            const game = getGame(playerInfo.gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            const { faceUpIndex } = data || {};
            const result = game.pickUpPile(playerInfo.playerId, faceUpIndex);

            callback({ success: true, result });

            // Broadcast updated state
            broadcastGameState(playerInfo.gameId);

        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Get current game state
     */
    socket.on('getGameState', (callback) => {
        try {
            const playerInfo = socketPlayers.get(socket.id);
            if (!playerInfo) {
                throw new Error('Player not found');
            }

            const game = getGame(playerInfo.gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            callback({
                success: true,
                gameState: game.getGameState(playerInfo.playerId)
            });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Send chat message
     */
    socket.on('sendChat', (data, callback) => {
        try {
            const playerInfo = socketPlayers.get(socket.id);
            if (!playerInfo) {
                throw new Error('Player not found');
            }

            const game = getGame(playerInfo.gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            const player = game.players.find(p => p.id === playerInfo.playerId);
            if (!player) {
                throw new Error('Player not in game');
            }

            const chatMessage = {
                playerId: player.id,
                playerName: player.name,
                message: data.message,
                timestamp: Date.now()
            };

            // Broadcast chat message to all players in the game
            for (const p of game.players) {
                const socketId = playerSockets.get(p.id);
                if (socketId) {
                    const playerSocket = io.sockets.sockets.get(socketId);
                    if (playerSocket) {
                        playerSocket.emit('chatMessage', chatMessage);
                    }
                }
            }

            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);

        const playerInfo = socketPlayers.get(socket.id);
        if (playerInfo) {
            const { playerId, gameId } = playerInfo;

            // Clean up
            playerSockets.delete(playerId);
            socketPlayers.delete(socket.id);

            // Optionally: remove player from game or mark as disconnected
            // For now, we'll keep them in the game
        }
    });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`Three Card Game server running on http://localhost:${PORT}`);
});
