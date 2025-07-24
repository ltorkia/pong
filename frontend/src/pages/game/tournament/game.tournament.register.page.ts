import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { router } from '../../../router/router';

export class GameMenuTournamentRegister extends BasePage {
    constructor(config: RouteConfig, nbPlayers: number) {
        super(config);
    }
    
    protected async mount(): Promise<void> {
        sessionStorage.removeItem("fromRedirect");
    }

    protected attachListeners(): void {
    }
}