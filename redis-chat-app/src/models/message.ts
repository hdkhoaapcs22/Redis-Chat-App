import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    senderId: String,
    receiverId: String,
    content: String,
    messageType: {
        type: String,
        enum: ["text", "image"],
        default: "text",
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    reaction: {
        type: String,
        default: "",
    },
    isEditted: Boolean,
    isDeleted: Boolean,
});

const MessageModel =
    mongoose.models.Message || mongoose.model("Message", MessageSchema);

export default MessageModel;
