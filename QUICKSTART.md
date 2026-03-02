# Quick Start Guide

## Get the Game Running in 3 Steps

### 1. Install Dependencies

```bash
cd three-card-game
npm install
```

### 2. Start the Server

```bash
npm start
```

You should see:
```
Three Card Game server running on http://localhost:3333
```

### 3. Open the Game

**Option A: Multiple Players on Same Computer**
1. Open **http://localhost:3333** in your browser
2. Open another tab/window in **incognito mode** for player 2
3. Or use different browsers (Chrome, Firefox, etc.)

**Option B: Multiple Players on Different Computers**
1. Player 1 starts the server and opens **http://localhost:3333**
2. Other players connect to **http://YOUR-IP-ADDRESS:3333**
   - To find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

## How to Play

### Creating a Game
1. Enter your name
2. Click "Create New Game"
3. Share the **Game ID** with other players
4. Wait for players to join (2-4 players)
5. Click "Start Game" when ready

### Joining a Game
1. Enter your name
2. Enter the **Game ID** from the host
3. Click "Join Game"
4. Wait for host to start

### Playing Cards
1. When it's your turn, click cards to select them
2. Selected cards highlight in green
3. Click "Play Selected Cards" to play
4. Or click "Pick Up Pile" if you can't play

### Winning
- Play all your hand cards
- Then play all your face-up cards
- Finally play all your face-down cards
- First to finish wins!

## Troubleshooting

### Port 3333 Already in Use?
Change the port in `src/server/server.js`:
```javascript
const PORT = process.env.PORT || 3334; // Change to different port
```

### Can't Connect from Another Computer?
1. Check your firewall settings
2. Make sure port 3333 is open
3. Verify you're on the same network

### Game Not Updating?
1. Refresh the page (F5)
2. Check browser console for errors (F12)
3. Restart the server

## Development Mode

For auto-restart on file changes:

```bash
npm run dev
```

## Next Steps

- Read full rules: `docs/GAME_RULES.md`
- Check main README: `README.md`
- Explore code: `src/game/`
