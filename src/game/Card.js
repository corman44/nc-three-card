/**
 * Card class representing a playing card
 */
class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    /**
     * Get numerical value for card comparison
     * 2 and 10 are special cards
     */
    getValue() {
        const values = {
            '3': 3,
            '4': 4,
            '5': 5,
            '6': 6,
            '7': 7,
            '8': 8,
            '9': 9,
            'J': 11,
            'Q': 12,
            'K': 13,
            'A': 14,
            '2': 15,  // Special: Reset
            '10': 16  // Special: Blow up
        };
        return values[this.rank];
    }

    /**
     * Check if card is special (2 or 10)
     */
    isSpecial() {
        return this.rank === '2' || this.rank === '10';
    }

    /**
     * Check if card is a reset card (2)
     */
    isReset() {
        return this.rank === '2';
    }

    /**
     * Check if card is a blow up card (10)
     */
    isBlowUp() {
        return this.rank === '10';
    }

    /**
     * Get string representation
     */
    toString() {
        return `${this.rank}${this.suit}`;
    }

    /**
     * Convert to JSON for network transmission
     */
    toJSON() {
        return {
            suit: this.suit,
            rank: this.rank
        };
    }

    /**
     * Create Card from JSON
     */
    static fromJSON(json) {
        return new Card(json.suit, json.rank);
    }
}

module.exports = Card;
