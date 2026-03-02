# Card Table Layout Changes

## Visual Design

### Main Card Table (Left/Center)
- **Background**: Radial gradient green felt effect (#2d5f3f to #1a4d2e)
- **Table Border**: Circular overlay with semi-transparent brown border for authentic card table feel
- **Layout Structure**:
  ```
  ┌─────────────────────────────────┐
  │   Game Info Bar (Top)           │
  ├─────────────────────────────────┤
  │   Other Players (Opponents)     │
  ├─────────────────────────────────┤
  │                                 │
  │      Center Pile Area           │
  │         (Middle)                │
  │                                 │
  ├─────────────────────────────────┤
  │   Your Cards (Bottom)           │
  │   [Hand] [Face-up] [Face-down]  │
  └─────────────────────────────────┘
  ```

### Control Panel (Right Side)
- **Width**: 280px (fixed on desktop)
- **Background**: Dark gradient (#2d3748 to #1a202c)
- **Border**: Brown/gold accent (#8b5a2b)
- **Sections**:
  1. **Game Status Info**
     - Cards in Deck
     - Cards in Pile
     - Your Total Cards
  2. **Action Buttons**
     - Play Selected Cards (purple gradient)
     - Pick Up Pile (pink gradient)
     - Message area

### Color Scheme
- **Table Green**: #1a4d2e, #2d5f3f
- **Dark Panels**: rgba(26, 26, 26, 0.6-0.7)
- **Accents**: #fbbf24 (gold), #48bb78 (green for active turn)
- **Text**: #cbd5e0, #f7fafc (light grays on dark)
- **Borders**: rgba(139, 90, 43, 0.4-0.6) (brown/wood tones)

## Key Features

1. **Immersive Experience**: Feels like sitting at a real card table
2. **Clear Separation**: Playing area vs controls
3. **Better Visibility**: Dark backgrounds make cards pop
4. **Professional Look**: Gradients, shadows, and backdrop blur effects
5. **Responsive**: Panel moves to bottom on mobile/tablet

## Responsive Breakpoints

- **Desktop (>1024px)**: Side-by-side layout with right panel
- **Tablet (768px-1024px)**: Control panel moves to bottom
- **Mobile (<768px)**: Full vertical stack, compact controls

## Visual Effects

- Backdrop blur on info bars and player area
- Glow effects on active turn indicator
- Hover animations on buttons
- Card shadows on dark felt background
- Semi-transparent overlays for depth

## User Experience Improvements

- All actions consolidated in one panel
- Quick glance at game stats without scrolling
- Clear visual hierarchy (opponents → pile → your cards → controls)
- Touch-friendly button sizes
- Better contrast for card readability
