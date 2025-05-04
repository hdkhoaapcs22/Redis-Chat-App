export interface Message {
    _id: string;
    senderId: string;
    content: string;
    messageType: "text" | "image";
    reaction: string;
    timestamp: Date;
    isEditted: boolean;
    isDeleted: boolean;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    image: string;
}
