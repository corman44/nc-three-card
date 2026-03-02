/**
 * Player class representing a game player
 */
class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.hand = [];
        this.faceUp = [];
        this.faceDown = [];
        this.isActive = true;
        this.finished = false;
        this.finishPosition = null;
    }

    /**
     * Add card to hand
     */
    addToHand(card) {
        this.hand.push(card);
        this.sortHand();
    }

    /**
     * Add multiple cards to hand
     */
    addCardsToHand(cards) {
        this.hand.push(...cards);
        this.sortHand();
    }

    /**
     * Sort hand by card value (lowest to highest)
     */
    sortHand() {
        this.hand.sort((a, b) => {
            // Get comparable values (3-14, with 2 and 10 having special values)
            const aVal = this.getCardSortValue(a);
            const bVal = this.getCardSortValue(b);
            return aVal - bVal;
        });
    }

    /**
     * Get card value for sorting purposes
     */
    getCardSortValue(card) {
        const values = {
            '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
            '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15
        };
        return values[card.rank] || 0;
    }

    /**
     * Add card to face-up pile
     */
    addToFaceUp(card) {
        this.faceUp.push(card);
    }

    /**
     * Add card to face-down pile
     */
    addToFaceDown(card) {
        this.faceDown.push(card);
    }

    /**
     * Remove card from hand
     */
    removeFromHand(cardIndex) {
        return this.hand.splice(cardIndex, 1)[0];
    }

    /**
     * Remove multiple cards from hand by indices
     */
    removeCardsFromHand(indices) {
        // Sort indices in descending order to maintain correct indices during removal
        const sortedIndices = [...indices].sort((a, b) => b - a);
        const removed = [];

        for (const index of sortedIndices) {
            removed.unshift(this.removeFromHand(index));
        }

        return removed;
    }

    /**
     * Remove card from face-up by index
     */
    removeFromFaceUp(cardIndex) {
        return this.faceUp.splice(cardIndex, 1)[0];
    }

    /**
     * Remove card from face-down by index
     */
    removeFromFaceDown(cardIndex) {
        return this.faceDown.splice(cardIndex, 1)[0];
    }

    /**
     * Get total number of cards player has
     */
    getTotalCards() {
        return this.hand.length + this.faceUp.length + this.faceDown.length;
    }

    /**
     * Check if player has no cards left
     */
    hasNoCards() {
        return this.getTotalCards() === 0;
    }

    /**
     * Check if hand is empty
     */
    isHandEmpty() {
        return this.hand.length === 0;
    }

    /**
     * Check if face-up cards are empty
     */
    isFaceUpEmpty() {
        return this.faceUp.length === 0;
    }

    /**
     * Get current playing zone (hand, faceUp, or faceDown)
     */
    getCurrentZone() {
        if (this.hand.length > 0) return 'hand';
        if (this.faceUp.length > 0) return 'faceUp';
        if (this.faceDown.length > 0) return 'faceDown';
        return null;
    }

    /**
     * Convert to JSON for client (hide face-down cards and other players' hands)
     */
    toJSON(viewingPlayerId = null) {
        const isOwnView = viewingPlayerId === this.id;

        return {
            id: this.id,
            name: this.name,
            handCount: this.hand.length,
            hand: isOwnView ? this.hand.map(c => c.toJSON()) : null,
            faceUp: this.faceUp.map(c => c.toJSON()),
            faceDownCount: this.faceDown.length,
            faceDown: isOwnView ? this.faceDown.map(c => c.toJSON()) : null,
            totalCards: this.getTotalCards(),
            currentZone: this.getCurrentZone(),
            isActive: this.isActive,
            finished: this.finished,
            finishPosition: this.finishPosition
        };
    }
}

module.exports = Player;
