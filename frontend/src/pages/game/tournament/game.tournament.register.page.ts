import { BasePage } from '../../base/base.page';
import { RouteConfig, RouteParams } from '../../../types/routes.types';
import { router } from '../../../router/router';
import { DEFAULT_ROUTE } from '../../../config/routes.config';

export class GameMenuTournamentRegister extends BasePage {
    private playersNb: number = 0;

    constructor(config: RouteConfig, nbPlayers: number) {
        super(config);
        this.playersNb = nbPlayers;
    }

    protected async preRenderCheck(): Promise<void> {
        if (sessionStorage.getItem("fromRedirect") !== "true") {
            router.navigate(DEFAULT_ROUTE);
            return ;
        }
    }

    protected async mount(): Promise<void> {
        sessionStorage.removeItem("fromRedirect");
    }

    protected attachListeners(): void {
    }
}