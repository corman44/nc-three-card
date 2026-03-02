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
    }

    /**
     * Add multiple cards to hand
     */
    addCardsToHand(cards) {
        this.hand.push(...cards);
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
