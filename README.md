# Minesweeper

A classic Minesweeper game built with [Angular](https://angular.dev) (v22), featuring the familiar grid-reveal gameplay, flagging, a mine counter, a timer, and multiple difficulty levels.

## Features

- 🧨 Classic left-click to reveal, right-click to flag gameplay
- 🚩 Live mine counter that tracks remaining unflagged mines
- ⏱️ Game timer
- 🙂 Reset button with a face that reacts to the game state (playing / won / lost)
- 🎚️ Selectable difficulty levels: **Beginner**, **Intermediate**, and **Expert**
- ⚡ Chording — clicking a revealed numbered cell reveals its neighbors when the correct number of surrounding flags are placed
- 🧩 Built with standalone Angular components (`Header`, `Board`, `Cell`) and a central `GameService` managing state via RxJS observables

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm `11.13.0` or later (this project pins its package manager via `packageManager` in [package.json](package.json))

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm start
```

Then open your browser and navigate to `http://localhost:4200/`. The app will automatically reload whenever you modify a source file.

## Project Structure

```
src/app/
├── components/
│   ├── header/   # Top bar: mine counter, reset face, timer, difficulty select
│   ├── board/    # Renders the grid and delegates cell interactions
│   └── cell/     # A single interactive board cell
├── services/
│   └── game.service.ts   # Core game logic and state (board, timer, flags, difficulty)
├── models/                # Cell and game data models
├── app.ts / app.html      # Root component wiring Header + Board together
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Runs `ng serve` for a local dev server |
| `npm run build` | Builds the project for production into `dist/` |
| `npm run watch` | Builds in watch mode with the development configuration |
| `npm test` | Runs unit tests via [Vitest](https://vitest.dev/) |

## How to Play

1. Left-click a cell to reveal it.
2. Right-click a cell to flag/unflag it as a suspected mine.
3. Numbers indicate how many mines are adjacent to that cell.
4. Left-click a revealed number when it has the matching number of flagged neighbors to auto-reveal the rest of its neighbors.
5. Reveal all non-mine cells to win — click a mine and it's game over!

## Additional Resources

For more information on the underlying tooling, see the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
