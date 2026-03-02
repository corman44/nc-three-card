# Three Card Game

A real-time multiplayer card game for 2-4 players using WebSockets.

## Game Overview

Three Card is a turn-based card game where players race to get rid of all their cards. The game uses a standard 52-card deck and features special cards that can change the flow of the game.

## Features

- **Real-time multiplayer** - Play with 2-4 players online
- **Turn-based gameplay** - Each player takes their turn in sequence
- **Special cards** - 2s reset the pile, 10s blow it up
- **Three card zones** - Hand, Face-up, and Face-down cards
- **Responsive UI** - Works on desktop and mobile

## Quick Start

### Installation

```bash
npm install
```

### Run the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### Access the Game

Open your browser to: **http://localhost:3333**

## How to Play

### Setup
- Each player receives:
  - 3 face-down cards (hidden)
  - 3 face-up cards (visible to all)
  - 3 hand cards (private)

### Objective
Be the first player to get rid of all your cards.

### On Your Turn

1. **Play Cards** - Play 1 or more cards of the same rank
2. **Rules:**
   - Cards must be equal to or higher than the top card on the pile
   - If playing multiple cards, they must all be the same rank
   - If you have fewer than 3 hand cards, draw from the deck

3. **Can't Play?** - Pick up the entire pile into your hand

### Special Cards

- **2 Card** - Resets the pile (next player can play any card) + take another turn
- **10 Card** - Blows up the pile (discards it) + take another turn
- **Four of a Kind** - If 4 cards of the same rank are on top, pile blows up + last player takes another turn

### Card Progression

1. **Hand Cards** - Play from your hand first
2. **Face-up Cards** - When hand is empty, play face-up cards
   - If face-up card is lower than pile, pick up pile + 1 face-up card
3. **Face-down Cards** - When hand and face-up are empty
   - Play blindly - if invalid, pick up pile + that card

### Winning

First player to play all cards (hand, face-up, face-down) wins!

## Project Structure

```
three-card-game/
├── public/              # Frontend files
│   ├── index.html       # Game UI
│   ├── css/
│   │   └── styles.css   # Styling
│   └── js/
│       └── app.js       # Client-side game logic
├── src/
│   ├── server/
│   │   └── server.js    # Express + Socket.IO server
│   └── game/
│       ├── Card.js      # Card class
│       ├── Deck.js      # Deck management
│       ├── Player.js    # Player class
│       └── Game.js      # Game engine and rules
├── docs/
│   └── GAME_RULES.md    # Detailed game rules
└── package.json
```

## Technical Details

### Backend
- **Node.js** + **Express** - Web server
- **Socket.IO** - Real-time WebSocket communication
- **UUID** - Unique game and player IDs

### Frontend
- **Vanilla JavaScript** - No frameworks
- **Socket.IO Client** - Real-time updates
- **Responsive CSS** - Mobile-friendly design

### Game Logic
- Turn-based state machine
- Card validation and special card handling
- Automatic turn progression
- Game state synchronization across all clients

## Game Flow

1. **Create/Join Game** - One player creates, others join with game ID
2. **Waiting Room** - Players wait until host starts (minimum 2 players)
3. **Game Play** - Turn-based gameplay with real-time updates
4. **Game Over** - Final standings displayed

## Development

### File Structure
- `src/game/` - Core game logic (can be tested independently)
- `src/server/` - WebSocket server and game management
- `public/` - Client-side code and assets

### Adding Features
- Game logic is in `src/game/Game.js`
- UI updates in `public/js/app.js`
- Styles in `public/css/styles.css`

## Future Enhancements

- [ ] Game lobbies and matchmaking
- [ ] Player rankings and statistics
- [ ] Reconnection handling
- [ ] Spectator mode
- [ ] AI opponents
- [ ] Sound effects and animations
- [ ] Chat system
- [ ] Custom rule variations

## License

MIT

## Author

Ceej
