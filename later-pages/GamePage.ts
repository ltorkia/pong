// import { Pong } from '../components/Game/Pong';

export class GamePage {
  private container: HTMLElement;
  private pongGame: Pong | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="flex flex-col items-center">
        <h1 class="text-3xl font-bold mb-4">Pong Game</h1>
        
        <div id="game-setup" class="mb-6 bg-gray-800 p-6 rounded-lg w-full max-w-md">
          <h2 class="text-xl font-semibold mb-4">Game Setup</h2>
          <form id="player-form" class="space-y-4">
            <div>
              <label for="player1" class="block text-sm font-medium">Player 1 Name</label>
              <input type="text" id="player1" name="player1" class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" required>
            </div>
            <div>
              <label for="player2" class="block text-sm font-medium">Player 2 Name</label>
              <input type="text" id="player2" name="player2" class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" required>
            </div>
            <button type="submit" class="w-full bg-pong-blue hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Start Game
            </button>
          </form>
        </div>
        
        <div id="game-container" class="hidden">
          <div class="flex justify-between items-center w-full mb-4">
            <div id="player1-score" class="text-2xl font-bold">0</div>
            <div class="text-xl">vs</div>
            <div id="player2-score" class="text-2xl font-bold">0</div>
          </div>
          <canvas id="pong-canvas" width="800" height="600" class="pong-canvas"></canvas>
          <div class="mt-4 flex justify-center">
            <button id="reset-game" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">
              Reset Game
            </button>
            <button id="end-game" class="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
              End Game
            </button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const playerForm = document.getElementById('player-form');
    const gameContainer = document.getElementById('game-container');
    const gameSetup = document.getElementById('game-setup');
    const resetButton = document.getElementById('reset-game');
    const endButton = document.getElementById('end-game');
    const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement;
    
    if (playerForm) {
      playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const player1Input = document.getElementById('player1') as HTMLInputElement;
        const player2Input = document.getElementById('player2') as HTMLInputElement;
        
        const player1Name = player1Input.value;
        const player2Name = player2Input.value;
        
        // Update player names in the UI
        const player1ScoreElement = document.getElementById('player1-score');
        const player2ScoreElement = document.getElementById('player2-score');
        
        if (player1ScoreElement) {
          player1ScoreElement.textContent = `${player1Name}: 0`;
        }
        
        if (player2ScoreElement) {
          player2ScoreElement.textContent = `${player2Name}: 0`;
        }
        
        // Hide setup, show game
        if (gameSetup) gameSetup.classList.add('hidden');
        if (gameContainer) gameContainer.classList.remove('hidden');
        
        // Initialize the game
        if (canvas) {
          this.pongGame = new Pong(canvas, player1Name, player2Name);
          this.pongGame.start();
        }
      });
    }
    
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        if (this.pongGame) {
          this.pongGame.reset();
        }
      });
    }
    
    if (endButton) {
      endButton.addEventListener('click', () => {
        if (this.pongGame) {
          this.pongGame.stop();
        }
        
        // Reset UI
        if (gameContainer) gameContainer.classList.add('hidden');
        if (gameSetup) gameSetup.classList.remove('hidden');
        
        // Reset form
        const player1Input = document.getElementById('player1') as HTMLInputElement;
        const player2Input = document.getElementById('player2') as HTMLInputElement;
        
        if (player1Input) player1Input.value = '';
        if (player2Input) player2Input.value = '';
      });
    }
  }
}