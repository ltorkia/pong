export interface ChatMessage {
	id: number;
	sender_id: number;
	receiver_id: number;
	time_send: string;
	message: string;
}