# Sound Effects System

The Three Card Game includes a built-in sound effects system using the Web Audio API. All sounds are generated procedurally - no audio files required!

## Features

- **Lightweight**: No audio files to download
- **Responsive**: Instant sound feedback
- **Customizable**: Adjust volume or disable sounds
- **Compatible**: Works in all modern browsers

## Sound Categories

### Simple Interaction Sounds

| Sound | Trigger | Description |
|-------|---------|-------------|
| Card Select | Clicking a card | Soft 800Hz beep |
| Card Deselect | Deselecting a card | Softer 600Hz beep |
| Button Click | Any button press | Crisp 1000Hz click |
| Confirm | Successful action | Ascending C-E melody |
| Error | Invalid action | Low 200Hz warning |

### Card Effect Sounds

| Effect | Sound | Description |
|--------|-------|-------------|
| Draw Cards | Rising melody | 3-note ascending progression |
| Swap Cards | Alternating tones | Back-and-forth E-C pattern |
| Peek Cards | High chimes | Delicate high-frequency melody |
| Attack/Blow Up | Aggressive descent | Sawtooth wave descent |
| Defend/Shield | Protective chord | Square wave harmony |
| Discard | Falling melody | Gentle descending notes |

### Game State Sounds

| State | Sound | Description |
|-------|-------|-------------|
| Turn Start | Fanfare | C-E-G ascending |
| Turn End | Soft tone | Single 440Hz note |
| Victory | Triumphant | 4-note rising celebration |
| Defeat | Somber | 3-note falling sequence |

## Technical Details

### Web Audio API

The sound system uses the Web Audio API to generate tones on-the-fly using oscillators:

- **Sine waves**: Smooth, melodic tones (card interactions)
- **Square waves**: Sharp, digital sounds (buttons, shields)
- **Sawtooth waves**: Aggressive, buzzy tones (attacks)
- **Triangle waves**: Soft, mellow tones (draws)

### Volume Control

Default volume is set to 30% to avoid being jarring. You can adjust it programmatically:

```javascript
soundManager.setVolume(0.5); // 50% volume
soundManager.setEnabled(false); // Disable all sounds
```

### Browser Support

Works in all modern browsers that support Web Audio API:
- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (all versions)
- ✅ Opera (all versions)

## Implementation

Sounds are integrated throughout the game:

1. **Lobby**: Button clicks, errors, confirmations
2. **Waiting Room**: Join/start game feedback
3. **Game**: Card selection, playing cards, special effects
4. **Game Over**: Victory/defeat fanfare

All sounds are non-blocking and won't interfere with gameplay.

## Customization

To add new sounds, edit `/public/js/sounds.js` and add methods to the `SoundManager` class:

```javascript
// Example: Add a custom "shuffle" sound
customShuffle() {
    this.playMelody([
        { freq: 440, duration: 0.05 },
        { freq: 660, duration: 0.05 },
        { freq: 440, duration: 0.05 },
        { freq: 660, duration: 0.05 }
    ], 0.05);
}
```

Then call it where needed in `app.js`:

```javascript
soundManager.customShuffle();
```

## Performance

- Minimal CPU usage
- No network requests
- No memory overhead for audio files
- Sounds are generated on-demand and immediately garbage collected
