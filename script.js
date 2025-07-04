import { Game } from './src/core/game.js'

(async () => {
  const game = new Game()
  await game.run()  // Wait for game init

  // Hide loading screen and show canvas
  document.getElementById('loading-screen').style.display = 'none'
  const canvas = document.getElementById('game')
  canvas.style.display = 'block'
})()
