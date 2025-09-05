# 🐱 Cat Runner Game

Chrome Dino Game inspired endless running game featuring a cute cat character with jump and slide mechanics.

## 🎮 Features

- **Endless Running**: Inspired by the Chrome Dino game
- **Cat Character**: Uses bcat.png, bcat_jump.png, and bcat_sliding.png sprites
- **Multiple Actions**: Jump (SPACE) and Slide (↓ arrow) mechanics
- **Progressive Difficulty**: 10-stage system with increasing speed
- **Multiple Obstacles**: Cactus, Rock, and Bird obstacles with different patterns
- **Real-time Scoring**: Live score and stage tracking
- **Responsive Design**: Canvas-based game with smooth 60fps animations

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Navigate to the game directory:
```bash
cd game-src/game-src
```

2. Install dependencies:
```bash
npm install next@latest react@latest react-dom@latest typescript @types/node @types/react @types/react-dom tailwindcss eslint eslint-config-next
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and go to `http://localhost:3000`

## 🎯 How to Play

1. **Start**: Press SPACE to start the game
2. **Jump**: Press SPACE to jump over obstacles
3. **Slide**: Press ↓ (down arrow) to slide under high obstacles
4. **Survive**: Avoid all obstacles and run as far as you can!

## 🎮 Game Mechanics

### Character States
- **Running**: Default state using `bcat.png`
- **Jumping**: Uses `bcat_jump.png` sprite
- **Sliding**: Uses `bcat_sliding.png` sprite (500ms duration)

### Stage System
- **Stages 1-10**: Base speed with gradual increase
- **Stages 11-20**: 10% speed increase, more frequent obstacles
- **Stages 21+**: 20%+ speed increase, complex patterns

### Obstacles
- **Cactus** (Green): Ground-level obstacle requiring jump
- **Rock** (Brown): Ground-level obstacle requiring jump  
- **Bird** (Blue): Mid-air obstacle requiring slide

### Scoring
- Score increases continuously while playing
- New stage every 1000 points
- Progress bar shows advancement to next stage

## 🏗️ Technical Architecture

### Built With
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **HTML5 Canvas** - Game rendering
- **React Hooks** - State management

### Project Structure
```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── GameCanvas.tsx
└── types/
    └── game.ts
```

### Key Components
- **GameCanvas**: Main game component with canvas rendering
- **Game Types**: TypeScript interfaces for game entities
- **Physics Engine**: Gravity, jump mechanics, collision detection

## 🎨 Game Assets

The game uses three cat sprite images:
- `bcat.png` - Running animation
- `bcat_jump.png` - Jumping state
- `bcat_sliding.png` - Sliding action

Assets should be placed in the `public/bcat/` directory.

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

## 🎮 Game States

1. **START**: Welcome screen with instructions
2. **PLAYING**: Active gameplay with physics and obstacles  
3. **GAME_OVER**: Final score display with restart option
4. **STAGE_CLEAR**: Achievement notifications (planned feature)

## 🔧 Development

### Adding New Features
- **New Obstacles**: Add to `Obstacle` type and `spawnObstacle()` function
- **Power-ups**: Extend `Cat` interface and add collection logic
- **Animations**: Add new sprite states and loading logic

### Performance
- 60 FPS game loop using `requestAnimationFrame`
- Efficient obstacle cleanup and memory management
- Canvas-based rendering for smooth animations

## 📱 Future Enhancements

- [ ] Mobile touch controls
- [ ] Sound effects and background music
- [ ] Power-up system (invincibility, double jump)
- [ ] Local high score storage
- [ ] Character skin customization
- [ ] Multiplayer leaderboards

## 🐛 Known Issues

- Image loading dependency on network connectivity
- Performance may vary on low-end devices

## 📄 License

This project is created for educational purposes. Cat sprite images should be properly licensed for commercial use.

## 🤝 Contributing

Feel free to fork the project and submit pull requests for new features or bug fixes!