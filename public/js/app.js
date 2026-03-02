// Socket.IO connection
const socket = io();

// Game state
let gameState = null;
let playerId = null;
let gameId = null;
let selectedCards = [];
let currentZone = 'hand';

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
        } else {
            // Clear previous selections
            selectedCards = [];
            document.querySelectorAll('.card.selected, .card-back.selected').forEach(c => {
                c.classList.remove('selected');
            });

            selectedCards.push({ index, zone: 'faceDown' });
            div.classList.add('selected');
            currentZone = 'faceDown';
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
    // Update both desktop and mobile buttons
    const playBtn = document.getElementById('play-cards-btn');
    const pickupBtn = document.getElementById('pickup-pile-btn');
    const playBtnMobile = document.getElementById('play-cards-btn-mobile');
    const pickupBtnMobile = document.getElementById('pickup-pile-btn-mobile');

    const canPlay = gameState.isYourTurn && selectedCards.length > 0;
    playBtn.disabled = !canPlay;
    playBtnMobile.disabled = !canPlay;

    const canPickup = gameState.isYourTurn && gameState.pileCount > 0;
    pickupBtn.disabled = !canPickup;
    pickupBtnMobile.disabled = !canPickup;

    // Update button text if face-up card selection is needed
    if (canPickup) {
        const currentPlayer = gameState.players.find(p => p.id === playerId);
        const needsFaceUpSelection = currentPlayer &&
                                      currentPlayer.handCount === 0 &&
                                      currentPlayer.faceUp.length > 0 &&
                                      gameState.deckCount === 0;

        const buttonText = needsFaceUpSelection ? 'Pick Up Pile (+ 1 Face-up)' : 'Pick Up Pile';
        pickupBtn.textContent = buttonText;
        pickupBtnMobile.textContent = buttonText;
    }
}

// Shared function to play cards
function handlePlayCards() {
    if (selectedCards.length === 0) return;

    const cardIndices = selectedCards.map(c => c.index);
    const zone = selectedCards[0].zone;

    socket.emit('playCards', { cardIndices, zone }, (response) => {
        if (response.success) {
            selectedCards = [];
            showMessage('game-message', 'Cards played!', 'success');
            showMessage('game-message-mobile', 'Cards played!', 'success');
        } else {
            showMessage('game-message', response.error, 'error');
            showMessage('game-message-mobile', response.error, 'error');
        }
    });
}

// Shared function to pick up pile
function handlePickupPile() {
    socket.emit('pickUpPile', {}, (response) => {
        if (response.success) {
            showMessage('game-message', 'Picked up pile', 'info');
            showMessage('game-message-mobile', 'Picked up pile', 'info');
        } else {
            showMessage('game-message', response.error, 'error');
            showMessage('game-message-mobile', response.error, 'error');
        }
    });
}

// Desktop buttons
document.getElementById('play-cards-btn').addEventListener('click', handlePlayCards);
document.getElementById('pickup-pile-btn').addEventListener('click', handlePickupPile);

// Mobile buttons
document.getElementById('play-cards-btn-mobile').addEventListener('click', handlePlayCards);
document.getElementById('pickup-pile-btn-mobile').addEventListener('click', handlePickupPile);

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
