export interface ChatModel {
	id: number;
	senderId: number;
	receiverId: number;
	timeSend: string;
	message: string;
}