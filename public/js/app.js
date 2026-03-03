// Socket.IO connection
const socket = io();

// Game state
let gameState = null;
let playerId = null;
let gameId = null;
let selectedCards = [];
let currentZone = 'hand';

// Sound Manager
const SoundManager = {
    audioContext: null,
    enabled: true,

    init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    },

    playCardSound() {
        if (!this.enabled || !this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.value = 400;
        osc.type = 'sine';
        gain.gain.value = 0.1;

        osc.start(this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        osc.stop(this.audioContext.currentTime + 0.1);
    },

    pickupSound() {
        if (!this.enabled || !this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.value = 300;
        osc.type = 'triangle';
        gain.gain.value = 0.15;

        osc.start(this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        osc.stop(this.audioContext.currentTime + 0.2);
    },

    explosionSound() {
        if (!this.enabled || !this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.value = 100;
        osc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        gain.gain.value = 0.3;

        osc.start(this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
        filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        osc.stop(this.audioContext.currentTime + 0.3);
    },

    bounceSound() {
        if (!this.enabled || !this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.value = 600;
        osc.type = 'sine';
        gain.gain.value = 0.12;

        osc.start(this.audioContext.currentTime);
        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.05);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        osc.stop(this.audioContext.currentTime + 0.2);
    },

    selectSound() {
        if (!this.enabled || !this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.value = 0.08;

        osc.start(this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        osc.stop(this.audioContext.currentTime + 0.05);
    },

    winSound() {
        if (!this.enabled || !this.audioContext) return;
        const playNote = (freq, delay, duration) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.frequency.value = freq;
            osc.type = 'triangle';
            gain.gain.value = 0.1;

            osc.start(this.audioContext.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + duration);
            osc.stop(this.audioContext.currentTime + delay + duration);
        };

        // Victory melody
        playNote(523, 0, 0.15);      // C
        playNote(659, 0.15, 0.15);   // E
        playNote(784, 0.3, 0.3);     // G
    }
};

// DOM Elements
const screens = {
    lobby: document.getElementById('lobby-screen'),
    waiting: document.getElementById('waiting-screen'),
    game: document.getElementById('game-screen'),
    gameover: document.getElementById('gameover-screen')
};

// Show specific screen
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');

    // Toggle body class for game screen
    if (screenName === 'game') {
        document.body.classList.add('game-active');
    } else {
        document.body.classList.remove('game-active');
    }
}

// Show message
function showMessage(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 5000);
}

// === LOBBY ===
// Load available games on page load
function loadAvailableGames() {
    socket.emit('getAvailableGames', (response) => {
        const gamesList = document.getElementById('available-games-list');

        if (response.success) {
            if (response.games.length === 0) {
                gamesList.innerHTML = '<div class="no-games">No games available. Create a new one!</div>';
            } else {
                gamesList.innerHTML = '';
                response.games.forEach(game => {
                    const gameItem = document.createElement('div');
                    gameItem.className = 'game-item';

                    gameItem.innerHTML = `
                        <div class="game-item-info">
                            <div class="game-item-id">${game.gameId.substring(0, 8)}...</div>
                            <div class="game-item-players">Players: ${game.playerCount}/${game.maxPlayers} - ${game.players.join(', ')}</div>
                        </div>
                        <button class="game-item-join" data-game-id="${game.gameId}">Join</button>
                    `;

                    gameItem.querySelector('.game-item-join').addEventListener('click', (e) => {
                        e.stopPropagation();
                        joinGameById(game.gameId);
                    });

                    gamesList.appendChild(gameItem);
                });
            }
        } else {
            gamesList.innerHTML = '<div class="no-games">Failed to load games</div>';
        }
    });
}

// Join a game by ID
function joinGameById(joinGameId) {
    const playerName = document.getElementById('player-name').value.trim();

    if (!playerName) {
        showMessage('lobby-message', 'Please enter your name first', 'error');
        return;
    }

    socket.emit('joinGame', { gameId: joinGameId, playerName }, (response) => {
        if (response.success) {
            playerId = response.playerId;
            gameId = joinGameId;
            gameState = response.gameState;

            document.getElementById('waiting-game-id').textContent = gameId;
            showScreen('waiting');
            updateWaitingRoom();
        } else {
            showMessage('lobby-message', response.error, 'error');
        }
    });
}

// Refresh games list every 3 seconds when on lobby screen
let gamesRefreshInterval = null;

function startGamesRefresh() {
    loadAvailableGames();
    gamesRefreshInterval = setInterval(() => {
        if (screens.lobby.classList.contains('active')) {
            loadAvailableGames();
        }
    }, 3000);
}

function stopGamesRefresh() {
    if (gamesRefreshInterval) {
        clearInterval(gamesRefreshInterval);
        gamesRefreshInterval = null;
    }
}

// Start loading games when socket connects
// Initialize sound on first user interaction (required by browsers)
document.addEventListener('click', () => {
    if (!SoundManager.audioContext) {
        SoundManager.init();
    }
}, { once: true });

socket.on('connect', () => {
    if (screens.lobby.classList.contains('active')) {
        startGamesRefresh();
    }
});

document.getElementById('create-game-btn').addEventListener('click', () => {
    const playerName = document.getElementById('player-name').value.trim();

    if (!playerName) {
        showMessage('lobby-message', 'Please enter your name', 'error');
        return;
    }

    socket.emit('createGame', { playerName, playerCount: 4 }, (response) => {
        if (response.success) {
            playerId = response.playerId;
            gameId = response.gameId;
            gameState = response.gameState;

            stopGamesRefresh();
            document.getElementById('waiting-game-id').textContent = gameId;
            showScreen('waiting');
            updateWaitingRoom();
        } else {
            showMessage('lobby-message', response.error, 'error');
        }
    });
});

document.getElementById('join-game-btn').addEventListener('click', () => {
    const playerName = document.getElementById('player-name').value.trim();
    const joinGameId = document.getElementById('game-id').value.trim();

    if (!playerName || !joinGameId) {
        showMessage('lobby-message', 'Please enter your name and game ID', 'error');
        return;
    }

    socket.emit('joinGame', { gameId: joinGameId, playerName }, (response) => {
        if (response.success) {
            playerId = response.playerId;
            gameId = joinGameId;
            gameState = response.gameState;

            document.getElementById('waiting-game-id').textContent = gameId;
            showScreen('waiting');
            updateWaitingRoom();
        } else {
            showMessage('lobby-message', response.error, 'error');
        }
    });
});

// === WAITING ROOM ===
function updateWaitingRoom() {
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';

    gameState.players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-item';
        div.textContent = player.name + (player.id === playerId ? ' (You)' : '');
        playersList.appendChild(div);
    });

    const startBtn = document.getElementById('start-game-btn');
    startBtn.disabled = gameState.players.length < 2;
}

document.getElementById('start-game-btn').addEventListener('click', () => {
    socket.emit('startGame', {}, (response) => {
        if (response.success) {
            // Game will start, wait for gameState update
        } else {
            alert(response.error);
        }
    });
});

// === GAME SCREEN ===
function updateGameScreen() {
    if (!gameState.gameStarted) return;

    // Update info bar
    document.getElementById('deck-count').textContent = gameState.deckCount;
    document.getElementById('pile-count').textContent = gameState.pileCount;

    // Update control panel info
    document.getElementById('deck-count-panel').textContent = gameState.deckCount;
    document.getElementById('pile-count-panel').textContent = gameState.pileCount;

    // Calculate player's total cards
    const myPlayer = gameState.players.find(p => p.id === playerId);
    if (myPlayer) {
        const totalCards = (myPlayer.hand?.length || 0) + myPlayer.faceUp.length + myPlayer.faceDownCount;
        document.getElementById('player-total-cards').textContent = totalCards;
    }

    // Update turn indicator
    const turnIndicator = document.getElementById('turn-indicator');
    if (gameState.isYourTurn) {
        turnIndicator.textContent = 'YOUR TURN';
        turnIndicator.className = 'turn-indicator your-turn';
    } else {
        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
        turnIndicator.textContent = `${currentPlayer?.name || 'Unknown'}'s Turn`;
        turnIndicator.className = 'turn-indicator';
    }

    // Update other players
    updateOtherPlayers();

    // Update pile
    updatePile();

    // Update player's cards
    updatePlayerCards();

    // Update buttons
    updateActionButtons();
}

function updateOtherPlayers() {
    const container = document.getElementById('other-players');
    container.innerHTML = '';

    const myPlayer = gameState.players.find(p => p.id === playerId);
    const otherPlayers = gameState.players.filter(p => p.id !== playerId);

    otherPlayers.forEach(player => {
        const div = document.createElement('div');
        div.className = 'opponent-card';

        if (player.id === gameState.currentPlayerId) {
            div.classList.add('active-turn');
        }

        const totalCards = player.totalCards || 0;

        // Render face-up cards
        let faceUpCardsHtml = '';
        if (player.faceUp && player.faceUp.length > 0) {
            faceUpCardsHtml = '<div class="opponent-faceup-cards">';
            player.faceUp.forEach(card => {
                const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
                faceUpCardsHtml += `
                    <div class="opponent-small-card ${color}">
                        <div class="card-rank">${card.rank}</div>
                        <div class="card-suit">${card.suit}</div>
                    </div>
                `;
            });
            faceUpCardsHtml += '</div>';
        }

        div.innerHTML = `
            <div class="opponent-name">${player.name}</div>
            ${faceUpCardsHtml}
            <div class="opponent-cards">
                <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 5px;">
                    Total Cards: ${totalCards}
                </div>
                <div style="font-size: 0.9em;">
                    Hand: ${player.handCount} |
                    Face-up: ${player.faceUp.length} |
                    Face-down: ${player.faceDownCount}
                </div>
            </div>
            ${player.finished ? '<div style="color: #48bb78; font-weight: bold; margin-top: 8px;">Finished</div>' : ''}
        `;

        container.appendChild(div);
    });
}

function updatePile() {
    const pileDisplay = document.getElementById('pile-display');

    if (!gameState.topCard) {
        pileDisplay.innerHTML = '<div class="empty-pile">Empty Pile</div>';
        return;
    }

    pileDisplay.innerHTML = renderCard(gameState.topCard);
}

function updatePlayerCards() {
    const myPlayer = gameState.players.find(p => p.id === playerId);

    if (!myPlayer) return;

    // Hand
    const handContainer = document.getElementById('player-hand');
    document.getElementById('hand-count').textContent = `(${myPlayer.hand?.length || 0})`;
    handContainer.innerHTML = '';

    if (myPlayer.hand) {
        myPlayer.hand.forEach((card, index) => {
            const cardEl = createCardElement(card, index, 'hand');
            handContainer.appendChild(cardEl);
        });
    }

    // Face-up
    const faceUpContainer = document.getElementById('player-faceup');
    document.getElementById('faceup-count').textContent = `(${myPlayer.faceUp.length})`;
    faceUpContainer.innerHTML = '';

    const canPlayFaceUp = myPlayer.hand?.length === 0;
    myPlayer.faceUp.forEach((card, index) => {
        const cardEl = createCardElement(card, index, 'faceUp', !canPlayFaceUp);
        faceUpContainer.appendChild(cardEl);
    });

    // Face-down
    const faceDownContainer = document.getElementById('player-facedown');
    document.getElementById('facedown-count').textContent = `(${myPlayer.faceDownCount})`;
    faceDownContainer.innerHTML = '';

    const canPlayFaceDown = myPlayer.hand?.length === 0 && myPlayer.faceUp.length === 0;
    for (let i = 0; i < myPlayer.faceDownCount; i++) {
        const cardBack = createCardBack(i, !canPlayFaceDown);
        faceDownContainer.appendChild(cardBack);
    }
}

function createCardElement(card, index, zone, disabled = false) {
    const div = document.createElement('div');
    div.className = 'card';

    const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
    div.classList.add(color);

    if (disabled) {
        div.classList.add('disabled');
    }

    div.innerHTML = `
        <div class="card-rank">${card.rank}</div>
        <div class="card-suit">${card.suit}</div>
    `;

    div.addEventListener('click', () => {
        if (!gameState.isYourTurn || disabled) return;

        const selectedIndex = selectedCards.findIndex(c => c.index === index && c.zone === zone);

        if (selectedIndex > -1) {
            selectedCards.splice(selectedIndex, 1);
            div.classList.remove('selected');
            SoundManager.selectSound();
        } else {
            // Check if selecting from correct zone
            if (selectedCards.length > 0 && selectedCards[0].zone !== zone) {
                // Clear previous selections
                selectedCards = [];
                document.querySelectorAll('.card.selected, .card-back.selected').forEach(c => {
                    c.classList.remove('selected');
                });
            }

            selectedCards.push({ index, zone });
            div.classList.add('selected');
            currentZone = zone;
            SoundManager.selectSound();
        }

        updateActionButtons();
    });

    return div;
}

function createCardBack(index, disabled = false) {
    const div = document.createElement('div');
    div.className = 'card-back';

    if (disabled) {
        div.classList.add('disabled');
        div.style.opacity = '0.5';
        div.style.cursor = 'not-allowed';
    }

    div.addEventListener('click', () => {
        if (!gameState.isYourTurn || disabled) return;

        const myPlayer = gameState.players.find(p => p.id === playerId);
        if (myPlayer.hand && myPlayer.hand.length > 0) return; // Can only play face-down when hand is empty
        if (myPlayer.faceUp && myPlayer.faceUp.length > 0) return; // Can only play face-down when face-up is empty

        const selectedIndex = selectedCards.findIndex(c => c.index === index && c.zone === 'faceDown');

        if (selectedIndex > -1) {
            selectedCards.splice(selectedIndex, 1);
            div.classList.remove('selected');
            SoundManager.selectSound();
        } else {
            // Clear previous selections
            selectedCards = [];
            document.querySelectorAll('.card.selected, .card-back.selected').forEach(c => {
                c.classList.remove('selected');
            });

            selectedCards.push({ index, zone: 'faceDown' });
            div.classList.add('selected');
            currentZone = 'faceDown';
            SoundManager.selectSound();
        }

        updateActionButtons();
    });

    return div;
}

function renderCard(card) {
    const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
    return `
        <div class="card ${color}">
            <div class="card-rank">${card.rank}</div>
            <div class="card-suit">${card.suit}</div>
        </div>
    `;
}

function updateActionButtons() {
    const playBtn = document.getElementById('play-cards-btn');
    const pickupBtn = document.getElementById('pickup-pile-btn');

    const canPlay = gameState.isYourTurn && selectedCards.length > 0;
    playBtn.disabled = !canPlay;

    const canPickup = gameState.isYourTurn && gameState.pileCount > 0;
    pickupBtn.disabled = !canPickup;

    // Update button text if face-up card selection is needed
    if (canPickup) {
        const currentPlayer = gameState.players.find(p => p.id === playerId);
        const needsFaceUpSelection = currentPlayer &&
                                      currentPlayer.handCount === 0 &&
                                      currentPlayer.faceUp.length > 0 &&
                                      gameState.deckCount === 0;

        if (needsFaceUpSelection) {
            pickupBtn.textContent = 'Pick Up Pile (+ 1 Face-up)';
        } else {
            pickupBtn.textContent = 'Pick Up Pile';
        }
    }
}

function triggerExplosion() {
    const container = document.getElementById('explosion-container');
    container.innerHTML = '';

    // Play explosion sound
    SoundManager.explosionSound();

    // Create flash effect
    const flash = document.createElement('div');
    flash.className = 'explosion-flash';
    container.appendChild(flash);

    // Create shockwave ring
    const ring = document.createElement('div');
    ring.className = 'explosion-ring';
    container.appendChild(ring);

    // Create particles
    const particleCount = 30;
    const colors = ['#ff6b00', '#ff9500', '#ffbb00', '#ff3d00', '#ffd700', '#ff5722'];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';

        // Random color
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];

        // Random direction and distance
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 80 + Math.random() * 120;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        // Random delay for staggered effect
        particle.style.animationDelay = `${Math.random() * 0.1}s`;

        container.appendChild(particle);
    }

    // Clean up after animation
    setTimeout(() => {
        container.innerHTML = '';
    }, 1000);
}

function triggerPileBounce() {
    const pileDisplay = document.getElementById('pile-display');
    pileDisplay.classList.add('bounce');

    // Play bounce sound
    SoundManager.bounceSound();

    // Remove class after animation completes
    setTimeout(() => {
        pileDisplay.classList.remove('bounce');
    }, 600);
}

// Play selected cards
document.getElementById('play-cards-btn').addEventListener('click', () => {
    if (selectedCards.length === 0) return;

    const cardIndices = selectedCards.map(c => c.index);
    const zone = selectedCards[0].zone;

    socket.emit('playCards', { cardIndices, zone }, (response) => {
        if (response.success) {
            selectedCards = [];

            // Trigger explosion animation if pile blew up
            if (response.result && response.result.blowUp) {
                triggerExplosion();
                showMessage('game-message', 'BOOM! Pile blown up!', 'success');
                // Sound is triggered in special effect handler
            }
            // Trigger bounce animation if reset card (2) was played (extraTurn but no blowUp)
            else if (response.result && response.result.extraTurn && !response.result.blowUp) {
                triggerPileBounce();
                showMessage('game-message', 'Reset! Play any card', 'success');
                // Sound is triggered in special effect handler
            }
            else {
                SoundManager.playCardSound();
                showMessage('game-message', 'Cards played!', 'success');
            }
        } else {
            showMessage('game-message', response.error, 'error');
        }
    });
});

// Pick up pile
document.getElementById('pickup-pile-btn').addEventListener('click', () => {
    // Check if player needs to select a face-up card
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    const needsFaceUpSelection = currentPlayer &&
                                  currentPlayer.handCount === 0 &&
                                  currentPlayer.faceUp.length > 0 &&
                                  gameState.deckCount === 0;

    if (needsFaceUpSelection) {
        // Check if a face-up card is selected
        const hasFaceUpSelected = selectedCards.length > 0 && selectedCards[0].zone === 'faceUp';

        if (!hasFaceUpSelected) {
            showMessage('game-message', 'Select a face-up card to pick up with the pile', 'error');
            return;
        }

        // Only allow one face-up card
        if (selectedCards.length > 1) {
            showMessage('game-message', 'Select only ONE face-up card to pick up', 'error');
            return;
        }

        const faceUpIndex = selectedCards[0].index;
        socket.emit('pickUpPile', { faceUpIndex }, (response) => {
            if (response.success) {
                selectedCards = [];
                SoundManager.pickupSound();
                showMessage('game-message', 'Picked up pile with face-up card', 'info');
            } else {
                showMessage('game-message', response.error, 'error');
            }
        });
    } else {
        // Normal pickup (no face-up card needed)
        socket.emit('pickUpPile', {}, (response) => {
            if (response.success) {
                SoundManager.pickupSound();
                showMessage('game-message', 'Picked up pile', 'info');
            } else {
                showMessage('game-message', response.error, 'error');
            }
        });
    }
});

// === GAME OVER ===
function showGameOver() {
    const standings = document.getElementById('final-standings');
    standings.innerHTML = '<h3>Final Standings:</h3>';

    gameState.players
        .filter(p => p.finished)
        .sort((a, b) => a.finishPosition - b.finishPosition)
        .forEach(player => {
            const div = document.createElement('div');
            div.className = 'player-item';
            div.textContent = `${player.finishPosition}. ${player.name}`;
            standings.appendChild(div);
        });

    // Play win sound if current player finished first
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (currentPlayer && currentPlayer.finished && currentPlayer.finishPosition === 1) {
        SoundManager.winSound();
    }

    showScreen('gameover');
}

document.getElementById('new-game-btn').addEventListener('click', () => {
    location.reload();
});

// === SOCKET EVENT HANDLERS ===
socket.on('gameState', (newGameState) => {
    gameState = newGameState;

    if (gameState.gameEnded) {
        showGameOver();
    } else if (gameState.gameStarted) {
        showScreen('game');
        updateGameScreen();
    } else {
        updateWaitingRoom();
    }
});

socket.on('disconnect', () => {
    alert('Disconnected from server');
});

// === CHAT ===
function addChatMessage(playerName, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';

    messageDiv.innerHTML = `
        <div class="chat-message-player">${playerName}</div>
        <div class="chat-message-text">${escapeHtml(message)}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    socket.emit('sendChat', { message }, (response) => {
        if (response.success) {
            input.value = '';
        } else {
            showMessage('game-message', 'Failed to send message', 'error');
        }
    });
}

document.getElementById('send-chat-btn').addEventListener('click', sendChatMessage);

document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

socket.on('chatMessage', (data) => {
    addChatMessage(data.playerName, data.message);
});

// Listen for special effects (explosion, bounce)
socket.on('specialEffect', (data) => {
    if (data.blowUp) {
        triggerExplosion();
        // Only show message if it's not our own play (we already got feedback)
        if (data.playerId !== playerId) {
            showMessage('game-message', `${data.playerName} blew up the pile!`, 'success');
        }
    } else if (data.extraTurn && !data.blowUp) {
        triggerPileBounce();
        // Only show message if it's not our own play
        if (data.playerId !== playerId) {
            showMessage('game-message', `${data.playerName} played a 2!`, 'success');
        }
    }
});
