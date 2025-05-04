export interface Message {
	_id: string;
	senderId: string;
	content: string;
	messageType: "text" | "image";
	reaction: string;
	timestamp: Date
}

export interface User {
	_id: string;
	name: string;
	email: string;
	image: string;
}