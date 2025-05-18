export class HomePage {
	private container: HTMLElement;
  
	constructor(container: HTMLElement) {
	  this.container = container;
	}
  
	public render(): void {
	  this.container.innerHTML = `
		<div class="flex flex-col items-center justify-center min-h-[80vh]">
		  <h1 class="text-4xl font-bold mb-8">Welcome to PONG Game</h1>
		  <div class="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
			<h2 class="text-2xl font-semibold mb-4">Quick Start</h2>
			<div class="mb-6">
			  <p class="mb-4">Join a tournament or play a quick game against a friend!</p>
			  <div class="flex justify-center space-x-4">
				<button id="play-button" class="bg-pong-blue hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
				  Play Now
				</button>
				<button id="tournament-button" class="bg-pong-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
				  Join Tournament
				</button>
			  </div>
			</div>
			<div class="border-t border-gray-700 pt-4">
			  <h3 class="text-xl font-semibold mb-2">How to Play</h3>
			  <ul class="list-disc list-inside space-y-2">
				<li>Use <strong>W/S</strong> keys for Player 1</li>
				<li>Use <strong>Up/Down</strong> arrows for Player 2</li>
				<li>First to 11 points wins!</li>
			  </ul>
			</div>
		  </div>
		</div>
	  `;
  
	  // Add event listeners
	  const playButton = document.getElementById('play-button');
	  const tournamentButton = document.getElementById('tournament-button');
  
	  if (playButton) {
		playButton.addEventListener('click', () => {
		  window.history.pushState({}, '', '/game');
		  const event = new PopStateEvent('popstate');
		  window.dispatchEvent(event);
		});
	  }
  
	  if (tournamentButton) {
		tournamentButton.addEventListener('click', () => {
		  window.history.pushState({}, '', '/tournament');
		  const event = new PopStateEvent('popstate');
		  window.dispatchEvent(event);
		});
	  }
	}
  }