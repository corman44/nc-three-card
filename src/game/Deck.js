const Card = require('./Card');

/**
 * Deck class representing a 52-card deck
 */
class Deck {
    constructor() {
        this.cards = [];
        this.initializeDeck();
    }

    /**
     * Create a standard 52-card deck
     */
    initializeDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        this.cards = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    /**
     * Shuffle the deck using Fisher-Yates algorithm
     */
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    /**
     * Draw a card from the top of the deck
     */
    draw() {
        return this.cards.pop();
    }

    /**
     * Draw multiple cards
     */
    drawMultiple(count) {
        const drawn = [];
        for (let i = 0; i < count && this.cards.length > 0; i++) {
            drawn.push(this.draw());
        }
        return drawn;
    }

    /**
     * Get number of cards remaining
     */
    count() {
        return this.cards.length;
    }

    /**
     * Check if deck is empty
     */
    isEmpty() {
        return this.cards.length === 0;
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            cards: this.cards.map(card => card.toJSON()),
            count: this.count()
        };
    }
}

module.exports = Deck;
