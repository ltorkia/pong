import { HomePage } from './pages/HomePage';
// import { GamePage } from './pages/GamePage';
import { TournamentPage } from './pages/TournamentPage';

export class App {
  private container: HTMLElement;
  private currentPage: any;
  private routes: { [key: string]: any } = {
    '/': HomePage,
    // '/game': GamePage,
    '/tournament': TournamentPage
  };

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Initialize the application
   */
  public initialize(): void {
    // Set up the navigation
    this.setupNavigation();
    
    // Handle the initial route
    this.handleRouteChange();
    
    // Listen for popstate events (back/forward buttons)
    window.addEventListener('popstate', () => this.handleRouteChange());
  }

  /**
   * Set up the navigation UI
   */
  private setupNavigation(): void {
    const nav = document.createElement('nav');
    nav.className = 'bg-gray-800 p-4';
    nav.innerHTML = `
      <div class="container mx-auto flex items-center justify-between">
        <div class="text-white font-bold text-xl">PONG Game</div>
        <div class="flex space-x-4">
          <a href="/" class="text-white hover:text-gray-300">Home</a>
          <a href="/game" class="text-white hover:text-gray-300">Play Game</a>
          <a href="/tournament" class="text-white hover:text-gray-300">Tournament</a>
        </div>
      </div>
    `;

    // Add event listeners to navigation links
    const links = nav.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          this.navigateTo(href);
        }
      });
    });

    // Add navigation to the page
    this.container.appendChild(nav);

    // Create a container for the page content
    const pageContainer = document.createElement('div');
    pageContainer.id = 'page-container';
    pageContainer.className = 'container mx-auto p-4';
    this.container.appendChild(pageContainer);
  }

  /**
   * Handle route changes
   */
  private handleRouteChange(): void {
    const path = window.location.pathname;
    const PageClass = this.routes[path] || this.routes['/'];
    
    // Clear current page content
    const pageContainer = document.getElementById('page-container');
    if (pageContainer) {
      pageContainer.innerHTML = '';
      
      // Initialize the new page
      this.currentPage = new PageClass(pageContainer);
      this.currentPage.render();
    }
  }

  /**
   * Navigate to a specific route
   */
  public navigateTo(route: string): void {
    window.history.pushState({}, '', route);
    this.handleRouteChange();
  }
}