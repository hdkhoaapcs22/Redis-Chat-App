import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    senderId: String,
    receiverId: String,
    messageIds: [{ type: mongoose.Schema.Types.String, ref: "Message" }],
});

const ConversationModel =
    mongoose.models.Conversation ||
    mongoose.model("Conversation", ConversationSchema);

export default ConversationModel;
