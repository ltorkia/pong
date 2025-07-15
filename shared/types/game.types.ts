export interface PositionObj {
    x: number, 
    y: number
}

export interface PlayerObj {
    window: {width: number, height: number}
    pos: {x: number, y: number};
}

export interface GameData {
    players: PositionObj[];
    ball: PositionObj;
}