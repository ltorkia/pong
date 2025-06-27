import { tsParticles } from "@tsparticles/engine";
import { particleColors, colorsTheme1 } from '../styles/theme/theme';

export class ParticlesManager {

	/**
	 * Chargement unique des particules au démarrage de l'app.
	 * - Cherche l'élément DOM #tsparticles et lance l'initialisation.
	 */
	public async load(): Promise<void> {
		const particlesElement = document.getElementById('tsparticles');
		if (particlesElement) {
			console.log(`[${this.constructor.name}] Initialisation de tsParticles...`);
			await this.initParticles();
		} else {
			console.warn(`[${this.constructor.name}] Élément #tsparticles introuvable`);
		}
	}

	/**
	 * Active l'affichage des particules.
	 */
	public async enable(): Promise<void> {
		const particlesElement = document.getElementById('tsparticles');
		if (!particlesElement) {
			console.warn(`[${this.constructor.name}] Élément #tsparticles introuvable`);
			return;
		}
		particlesElement.style.opacity = '1';
		console.log(`[${this.constructor.name}] Particules présentes et visibles`);
	}

	/**
	 * Désactive l'affichage des particules.
	 */
	public async disable(): Promise<void> {
		const particlesElement = document.getElementById('tsparticles');
		if (!particlesElement) {
			console.warn(`[${this.constructor.name}] Élément #tsparticles introuvable`);
			return;
		}
		particlesElement.style.opacity = '0';
		console.log(`[${this.constructor.name}] Particules désactivées`);
	}

	/**
	 * Méthode privée qui initialise la librairie tsParticles
	 * avec la conf complète des particules (couleurs, formes,
	 * mouvements, interactivité, etc).
	 */
	private async initParticles(): Promise<void> {
		try {
			await tsParticles.load({
				id: "tsparticles",
				options: {
					background: {
						opacity: 0
					},
					particles: {
						number: { 
							value: 80,
							density: {
								enable: true,
								width: 1000,
								height: 1000
							}
						},
						color: { 
							value: [				
								particleColors.forestGold, 
								particleColors.forestLight, 
								particleColors.forestLavender,
								particleColors.forestSky,
								particleColors.forestGreen
							]
						},
						shape: { 
							type: ["circle"]
						},
						opacity: {
							value: { min: 0.1, max: 0.6 },
							animation: {
								enable: true,
								speed: 0.5,
								sync: false,
								startValue: "random",
								destroy: "none"
							}
						},
						size: { 
							value: { min: 0.5, max: 2 },
							animation: {
								enable: true,
								speed: 2,
								sync: false,
								startValue: "random"
							}
						},
						move: { 
							enable: true, 
							speed: { min: 0.5, max: 1.2 },
							direction: "none",
							random: true,
							straight: false,
							outModes: {
								default: "out"
							},
						},
						twinkle: {
							particles: {
								enable: true,
								frequency: 0.05,
								opacity: 1,
								color: {
									value: [particleColors.forestGold, colorsTheme1.white, particleColors.forestLight]
								}
							}
						},
						shadow: {
							blur: 5,
							color: {
								value: colorsTheme1.white
							},
							enable: true,
							offset: {
								x: 0,
								y: 0
							}
						}
					},
					interactivity: {
						detectsOn: "window",
						events: {
							onHover: {
								enable: true,
								mode: ["repulse"],
								parallax: {
									enable: false,
									force: 100,
									smooth: 10
								}
							},
							onClick: {
								enable: true,
								mode: "push"
							},
							resize: {
								enable: true
							}
						},
						modes: {
							repulse: {
								distance: 80,
								duration: 1.2,
								factor: 3,
								speed: 0.5,
								maxSpeed: 15,
								easing: "ease-out-cubic"
							},
							push: {
								quantity: 2
							}
						}
					},
					detectRetina: true,
					emitters: [
						{
							autoPlay: true,
							fill: true,
							life: {
								wait: false
							},
							rate: {
								quantity: 1,
								delay: 2
							},
							shape: "square",
							startCount: 0,
							size: {
								mode: "percent",
								height: 0,
								width: 0
							},
							particles: {
								color: {
									value: particleColors.forestFirefly
								},
								shape: {
									type: "circle"
								},
								size: {
									value: { min: 0.5, max: 1.5 },
									animation: {
										enable: true,
										speed: 3,
										minimumValue: 0.5,
										sync: false
									}
								},
								opacity: {
									value: { min: 0.3, max: 0.8 },
									animation: {
										enable: true,
										speed: 1,
										minimumValue: 0.3,
										sync: false
									}
								},
								move: {
									enable: true,
									speed: 1,
									direction: "none",
									random: true,
									straight: false
								}
							},
							position: {
								x: Math.random() * 100,
								y: Math.random() * 100
							}
						}
					]
				}
			});
			console.log(`[${this.constructor.name}] Particules chargées`);
			
		} catch (error) {
			console.error(`[${this.constructor.name}] Erreur de chargement des particules:`, error);
		}
	}
}