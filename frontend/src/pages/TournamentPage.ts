export class TournamentPage {
	private container: HTMLElement;

	constructor(container: HTMLElement) {
		this.container = container;
	}

	public render(): void {
		this.container.innerHTML = `
			<div class="flex flex-col items-center">
			<h1 class="text-3xl font-bold mb-6">Tournament Mode</h1>
			
				<div id="tournament-setup" class="mb-6 bg-gray-800 p-6 rounded-lg w-full max-w-md">
					<h2 class="text-xl font-semibold mb-4">Create Tournament</h2>
					<form id="tournament-form" class="space-y-4">
						<div>
							<label for="tournament-name" class="block text-sm font-medium">Tournament Name</label>
							<input type="text" id="tournament-name" name="tournamentName" class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" required>
						</div>
						
						<div>
							<label class="block text-sm font-medium mb-2">Players</label>
							<div id="players-container" class="space-y-2">
							<div class="flex">
								<input type="text" name="players[]" class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" placeholder="Player 1" required>
							</div>
							<div class="flex">
								<input type="text" name="players[]" class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" placeholder="Player 2" required>
							</div>
							</div>
							<button type="button" id="add-player" class="mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded text-sm">
							+ Add Player
							</button>
						</div>
						
						<button type="submit" class="w-full bg-pong-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
							Start Tournament
						</button>
					</form>
				</div>
				
				<div id="tournament-view" class="hidden w-full">
					<div class="mb-6">
						<h2 id="tournament-title" class="text-2xl font-bold text-center"></h2>
						<p class="text-center text-gray-400">Bracket View</p>
					</div>
					
					<div id="tournament-bracket" class="flex justify-center p-4 bg-gray-800 rounded-lg overflow-x-auto">
						<!-- Tournament bracket will be generated here -->
					</div>
					
					<div class="mt-6">
						<h3 class="text-xl font-semibold mb-2">Current Match</h3>
						<div id="current-match" class="p-4 bg-gray-700 rounded-lg">
							<p class="text-center">No match in progress</p>
						</div>
						
						<div class="mt-4 flex justify-center">
							<button id="next-match" class="bg-pong-blue hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
							Next Match
							</button>
							<button id="end-tournament" class="ml-4 bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
							End Tournament
							</button>
						</div>
					</div>
				</div>
			</div>
		`;

		// Add event listeners
		const tournamentForm = document.getElementById('tournament-form');
		const addPlayerButton = document.getElementById('add-player');
		const playersContainer = document.getElementById('players-container');
		const tournamentSetup = document.getElementById('tournament-setup');
		const tournamentView = document.getElementById('tournament-view');
		const tournamentTitle = document.getElementById('tournament-title');
		const endTournamentButton = document.getElementById('end-tournament');
		const nextMatchButton = document.getElementById('next-match');
		
		// Add player field
		if (addPlayerButton && playersContainer) {
			addPlayerButton.addEventListener('click', () => {
				const playerCount = playersContainer.children.length + 1;
				const playerDiv = document.createElement('div');
				playerDiv.className = 'flex';
				playerDiv.innerHTML = `
					<input type="text" name="players[]" class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" placeholder="Player ${playerCount}" required>
					<button type="button" class="ml-2 bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded text-sm remove-player">
					&times;
					</button>
				`;
				
				// Add remove player functionality
				const removeButton = playerDiv.querySelector('.remove-player');
				if (removeButton) {
					removeButton.addEventListener('click', () => {
						playerDiv.remove();
					});
				}
				
				playersContainer.appendChild(playerDiv);
			});
		}
		
		// Handle tournament form submission
		if (tournamentForm) {
			tournamentForm.addEventListener('submit', (e) => {
				e.preventDefault();
				
				const formData = new FormData(tournamentForm as HTMLFormElement);
				const tournamentName = formData.get('tournamentName') as string;
				const playerInputs = document.querySelectorAll<HTMLInputElement>('input[name="players[]"]');
				
				const players: string[] = [];
				playerInputs.forEach(input => {
					if (input.value.trim()) {
						players.push(input.value.trim());
					}
				});
				
				// Make sure we have at least 2 players
				if (players.length < 2) {
					alert('You need at least 2 players for a tournament');
					return;
				}
				
				// Update UI
				if (tournamentTitle) {
					tournamentTitle.textContent = tournamentName;
				}
				
				if (tournamentSetup) tournamentSetup.classList.add('hidden');
				if (tournamentView) tournamentView.classList.remove('hidden');
				
				// Generate and display tournament bracket
				this.generateTournamentBracket(players);
			});
		}
		
		// End tournament
		if (endTournamentButton) {
			endTournamentButton.addEventListener('click', () => {
				if (tournamentView) tournamentView.classList.add('hidden');
				if (tournamentSetup) tournamentSetup.classList.remove('hidden');
				
				// Reset form
				const tournamentNameInput = document.getElementById('tournament-name') as HTMLInputElement;
				if (tournamentNameInput) tournamentNameInput.value = '';
				
				if (playersContainer) {
					// Keep only the first two player inputs
					const playerInputs = playersContainer.querySelectorAll('.flex');
					for (let i = 2; i < playerInputs.length; i++) {
						playerInputs[i].remove();
					}
					
					// Clear values of remaining inputs
					const remainingInputs = playersContainer.querySelectorAll<HTMLInputElement>('input');
					remainingInputs.forEach(input => {
					input.value = '';
					});
				}
			});
		}
		
		// Next match button
		if (nextMatchButton) {
			nextMatchButton.addEventListener('click', () => {
				const currentMatch = document.getElementById('current-match');
				if (currentMatch) {
					// For demonstration purposes only
					currentMatch.innerHTML = `
					<div class="text-center">
						<p class="text-lg font-semibold mb-2">Match in progress</p>
						<div class="flex justify-center items-center">
						<span class="text-xl">Player 1</span>
						<span class="mx-3 text-lg">vs</span>
						<span class="text-xl">Player 2</span>
						</div>
						<p class="mt-2 text-gray-400">Press Space to start the game</p>
					</div>
					`;
				}
			});
		}
	}
	
	private generateTournamentBracket(players: string[]): void {
		const tournamentBracket = document.getElementById('tournament-bracket');
		if (!tournamentBracket) return;
		
		// Shuffle players for random matchups
		this.shuffleArray(players);
		
		// Create a simple bracket visualization
		let bracketHTML = '<div class="flex flex-col space-y-4">';
		
		// Round 1
		bracketHTML += '<div class="flex space-x-4">';
		for (let i = 0; i < players.length; i += 2) {
			const player1 = players[i];
			const player2 = i + 1 < players.length ? players[i + 1] : 'BYE';
			
			bracketHTML += `
			<div class="bg-gray-700 p-3 rounded-lg min-w-[200px]">
				<div class="text-center font-semibold mb-2">Round 1</div>
				<div class="border-b border-gray-600 pb-1 mb-1">${player1}</div>
				<div>${player2}</div>
			</div>
			`;
		}
		bracketHTML += '</div>';
		
		// For simplicity, just add one more round
		const roundsNeeded = Math.ceil(Math.log2(players.length));
		if (roundsNeeded > 1) {
			bracketHTML += `
			<div class="flex justify-center">
				<div class="bg-gray-700 p-3 rounded-lg min-w-[200px]">
				<div class="text-center font-semibold mb-2">Finals</div>
				<div class="border-b border-gray-600 pb-1 mb-1">Winner of Match 1</div>
				<div>Winner of Match 2</div>
				</div>
			</div>
			`;
		}
		
		bracketHTML += '</div>';
		tournamentBracket.innerHTML = bracketHTML;
	}
	
	private shuffleArray(array: any[]): void {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	}
}