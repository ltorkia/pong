

export interface ChatMessage {
	id: number;
	sender_id: number;
	receiver_id: number;
	time_send: string;
	message: string;
}

export interface Game {
	id: number;
	status_win: boolean;
	duration: number;
}

export interface Friends {
	id: number;
	pseudo: string;
	avatar?: string | null;
	lastlog: number;
}

