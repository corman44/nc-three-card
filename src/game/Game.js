const Deck = require('./Deck');
const Player = require('./Player');
const Card = require('./Card');

/**
 * Game class - manages the Three Card game logic
 */
class Game {
    constructor(gameId, playerCount = 4) {
        this.gameId = gameId;
        this.players = [];
        this.deck = new Deck();
        this.pile = [];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.gameStarted = false;
        this.gameEnded = false;
        this.maxPlayers = playerCount;
        this.finishOrder = [];
    }

    /**
     * Add a player to the game
     */
    addPlayer(playerId, playerName) {
        if (this.players.length >= this.maxPlayers) {
            throw new Error('Game is full');
        }

        if (this.gameStarted) {
            throw new Error('Game already started');
        }

        const player = new Player(playerId, playerName);
        this.players.push(player);

        return player;
    }

    /**
     * Remove a player from the game
     */
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
    }

    /**
     * Start the game
     */
    startGame() {
        if (this.players.length < 2) {
            throw new Error('Need at least 2 players to start');
        }

        this.deck.shuffle();
        this.dealCards();
        this.gameStarted = true;

        // First player is random or player with lowest face-up card
        this.currentPlayerIndex = this.determineFirstPlayer();

        return {
            started: true,
            currentPlayer: this.getCurrentPlayer().id
        };
    }

    /**
     * Deal cards to all players
     */
    dealCards() {
        // Each player gets 3 face-down, 3 face-up, 3 hand cards
        for (const player of this.players) {
            // Face-down cards (3)
            for (let i = 0; i < 3; i++) {
                player.addToFaceDown(this.deck.draw());
            }

            // Face-up cards (3)
            for (let i = 0; i < 3; i++) {
                player.addToFaceUp(this.deck.draw());
            }

            // Hand cards (3)
            for (let i = 0; i < 3; i++) {
                player.addToHand(this.deck.draw());
            }
        }
    }

    /**
     * Determine first player (random for now, could be lowest face-up card)
     */
    determineFirstPlayer() {
        return Math.floor(Math.random() * this.players.length);
    }

    /**
     * Get current player
     */
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    /**
     * Get top card of pile
     */
    getTopCard() {
        return this.pile.length > 0 ? this.pile[this.pile.length - 1] : null;
    }

    /**
     * Check if cards can be played
     */
    canPlayCards(cards) {
        if (cards.length === 0) return false;

        // All cards must be same rank
        const firstRank = cards[0].rank;
        if (!cards.every(card => card.rank === firstRank)) {
            return false;
        }

        const topCard = this.getTopCard();

        // If pile is empty or reset, any card can be played
        if (!topCard || this.pile.length === 0) {
            return true;
        }

        // Special cards (2 and 10) can always be played
        if (cards[0].isSpecial()) {
            return true;
        }

        // Card must be equal or higher value
        return cards[0].getValue() >= topCard.getValue();
    }

    /**
     * Play cards to the pile
     */
    playCards(playerId, cardIndices, zone = 'hand') {
        const player = this.players.find(p => p.id === playerId);

        if (!player) {
            throw new Error('Player not found');
        }

        if (this.getCurrentPlayer().id !== playerId) {
            throw new Error('Not your turn');
        }

        let cards = [];

        // Enforce playing order: hand -> faceUp -> faceDown
        if (zone === 'faceUp' && player.hand.length > 0) {
            throw new Error('Must play all hand cards before playing face-up cards');
        }

        if (zone === 'faceDown' && (player.hand.length > 0 || player.faceUp.length > 0)) {
            throw new Error('Must play all hand and face-up cards before playing face-down cards');
        }

        // Get cards based on zone
        if (zone === 'hand') {
            cards = cardIndices.map(i => player.hand[i]).filter(c => c);
        } else if (zone === 'faceUp') {
            cards = cardIndices.map(i => player.faceUp[i]).filter(c => c);
        } else if (zone === 'faceDown') {
            // Face-down: can only play one card blindly
            if (cardIndices.length !== 1) {
                throw new Error('Can only play one face-down card at a time');
            }
            cards = [player.faceDown[cardIndices[0]]];
        }

        if (cards.length === 0) {
            throw new Error('No valid cards selected');
        }

        // Check if cards can be played
        const canPlay = this.canPlayCards(cards);

        if (!canPlay && zone !== 'faceDown') {
            throw new Error('Cannot play these cards');
        }

        // For face-down, if can't play, pick up pile
        if (zone === 'faceDown' && !canPlay) {
            player.addCardsToHand([...this.pile, cards[0]]);
            player.removeFromFaceDown(cardIndices[0]);
            this.pile = [];
            this.nextTurn();
            return {
                success: false,
                pickedUp: true,
                message: 'Face-down card was invalid, picked up pile'
            };
        }

        // Remove cards from player's zone
        if (zone === 'hand') {
            player.removeCardsFromHand(cardIndices);
        } else if (zone === 'faceUp') {
            cardIndices.sort((a, b) => b - a).forEach(i => player.removeFromFaceUp(i));
        } else if (zone === 'faceDown') {
            player.removeFromFaceDown(cardIndices[0]);
        }

        // Add cards to pile
        this.pile.push(...cards);

        // Check for special effects
        let extraTurn = false;
        let blowUp = false;

        // Check for blow up (10 card)
        if (cards[0].isBlowUp()) {
            this.discardPile.push(...this.pile);
            this.pile = [];
            extraTurn = true;
            blowUp = true;
        }

        // Check for reset (2 card)
        else if (cards[0].isReset()) {
            extraTurn = true;
        }

        // Check for four of a kind
        else if (this.checkFourOfAKind()) {
            this.discardPile.push(...this.pile);
            this.pile = [];
            extraTurn = true;
            blowUp = true;
        }

        // Refill hand if needed (and deck not empty)
        if (zone === 'hand' && !this.deck.isEmpty()) {
            const needed = 3 - player.hand.length;
            if (needed > 0) {
                const drawn = this.deck.drawMultiple(needed);
                player.addCardsToHand(drawn);
            }
        }

        // Check if player finished
        if (player.hasNoCards()) {
            player.finished = true;
            this.finishOrder.push(player.id);
            player.finishPosition = this.finishOrder.length;

            // Check if game is over
            if (this.finishOrder.length === this.players.length - 1) {
                this.gameEnded = true;
            }
        }

        // Next turn if no extra turn
        if (!extraTurn && !player.finished) {
            this.nextTurn();
        } else if (player.finished) {
            this.nextTurn();
        }

        return {
            success: true,
            extraTurn,
            blowUp,
            playerFinished: player.finished,
            gameEnded: this.gameEnded
        };
    }

    /**
     * Check for four of a kind on top of pile
     */
    checkFourOfAKind() {
        if (this.pile.length < 4) return false;

        const topFour = this.pile.slice(-4);
        const rank = topFour[0].rank;

        return topFour.every(card => card.rank === rank);
    }

    /**
     * Pick up the pile
     */
    pickUpPile(playerId, faceUpIndex = null) {
        const player = this.players.find(p => p.id === playerId);

        if (!player) {
            throw new Error('Player not found');
        }

        if (this.getCurrentPlayer().id !== playerId) {
            throw new Error('Not your turn');
        }

        // Add pile to hand
        player.addCardsToHand([...this.pile]);
        this.pile = [];

        // If picking up from face-up zone, also add one face-up card
        if (faceUpIndex !== null && player.faceUp[faceUpIndex]) {
            player.addToHand(player.removeFromFaceUp(faceUpIndex));
        }

        this.nextTurn();

        return { pickedUp: true };
    }

    /**
     * Move to next player's turn
     */
    nextTurn() {
        // Skip finished players
        let attempts = 0;
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            attempts++;
        } while (this.players[this.currentPlayerIndex].finished && attempts < this.players.length);

        return this.getCurrentPlayer();
    }

    /**
     * Get game state for a specific player
     */
    getGameState(playerId) {
        return {
            gameId: this.gameId,
            players: this.players.map(p => p.toJSON(playerId)),
            pile: this.pile.map(c => c.toJSON()),
            pileCount: this.pile.length,
            topCard: this.getTopCard()?.toJSON(),
            deckCount: this.deck.count(),
            currentPlayerId: this.getCurrentPlayer().id,
            isYourTurn: this.getCurrentPlayer().id === playerId,
            gameStarted: this.gameStarted,
            gameEnded: this.gameEnded,
            finishOrder: this.finishOrder
        };
    }

    /**
     * Convert game to JSON
     */
    toJSON() {
        return {
            gameId: this.gameId,
            players: this.players.map(p => p.toJSON()),
            pile: this.pile.map(c => c.toJSON()),
            deckCount: this.deck.count(),
            currentPlayerIndex: this.currentPlayerIndex,
            gameStarted: this.gameStarted,
            gameEnded: this.gameEnded
        };
    }
}

module.exports = Game;
