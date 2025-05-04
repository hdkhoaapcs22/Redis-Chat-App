"use server";

import { redis } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { pusherServer } from "@/lib/pusher";
import { connectDb } from "@/lib/db";

import ConversationModel from "@/models/conversation";
import MessageModel from "@/models/message";
import { Message } from "@/db/types";

type SendMessageActionArgs = {
    content: string;
    receiverId: string;
    messageType: "text" | "image";
};

type DeleteMessageActionArgs = {
    messageId: string;
};

export async function sendMessageAction({
    content,
    messageType,
    receiverId,
}: SendMessageActionArgs) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user) return { success: false, message: "User not authenticated" };

    const senderId = user.id;

    const conversationId = `conversation:${[senderId, receiverId]
        .sort()
        .join(":")}`;

    const messageId = `message:${Date.now()}:${Math.random()
        .toString(36)
        .substring(2, 9)}`;
    const timestamp = Date.now();

    const conversationExist = await ConversationModel.findOne({
        _id: conversationId,
    });
    if (conversationExist) {
        await ConversationModel.updateOne(
            { _id: conversationId },
            { $push: { messageIds: messageId } }
        );
    } else {
        const incomingConversation = new ConversationModel({
            _id: conversationId,
            senderId,
            receiverId,
            messageIds: [messageId],
        });

        await incomingConversation.save();
    }
    const incomingMessage = new MessageModel({
        _id: messageId,
        senderId,
        receiverId,
        content,
        timestamp,
        messageType,
    });

    await incomingMessage.save();

    const channelName = `${senderId}__${receiverId}`
        .split("__")
        .sort()
        .join("__");

    await pusherServer?.trigger(channelName, "newMessage", {
        message: { senderId, content, timestamp, messageType },
    });

    await redis.zadd(`${conversationId}:messages`, {
        score: timestamp,
        member: JSON.stringify(messageId),
    });
    await redis.zremrangebyrank(`${conversationId}:messages`, 0, -201);

    await redis.hset(messageId, {
        senderId,
        content,
        timestamp,
        messageType,
        reaction: "",
    });
    await redis.expire(messageId, 60 * 5);

    return { success: true, conversationId, messageId };
}

export async function getMessageAction(
    selectedUserId: string,
    currentUserId: string
) {
    console.log("GetMESSAGE IS CREATED");
    const conversationId =
        `conversation:${[selectedUserId, currentUserId].sort().join(":")}` +
        ":messages";

    const existConversation = await redis.exists(conversationId);
    if (!existConversation) return [];

    const messageIds = await redis.zrange(conversationId, 0, -1);

    const pipeline = redis.pipeline();
    messageIds.forEach((id) => pipeline.hgetall(id as string));
    const results = (await pipeline.exec()) as Message[];
    const messages = await Promise.all(
        results.map(async (result, index) => {
            if (!result || Object.keys(result).length === 0) {
                // Redis không có message, fallback sang MongoDB
                const mongoMsg = await MessageModel.findOne({
                    _id: messageIds[index],
                }).lean<Message>();
                if (mongoMsg) {
                    return {
                        senderId: mongoMsg.senderId,
                        content: mongoMsg.content,
                        timestamp: mongoMsg.timestamp,
                        messageType: mongoMsg.messageType,
                        reaction: mongoMsg.reaction,
                    };
                } else {
                    return null; // Không tồn tại trong Redis lẫn MongoDB
                }
            } else {
                // Redis trả về message hợp lệ
                return {
                    senderId: result.senderId,
                    content: result.content,
                    timestamp: result.timestamp,
                    messageType: result.messageType,
                    reaction: result.reaction,
                };
            }
        })
    );
    return messages.filter((msg) => msg !== null);

    // console.log("results: ", typeof results, results);

    // Lọc các message null (không còn trong cả Redis lẫn MongoDB)
    // return messages.filter((msg) => msg !== null);
    // return [];
}

export async function getOlderMessages({
    selectedUserId,
    currentUserId,
    beforeTimestamp,
    limit = 50,
}: {
    selectedUserId: string;
    currentUserId: string;
    beforeTimestamp: number;
    limit?: number;
}) {
    const conversationId = `conversation:${[selectedUserId, currentUserId]
        .sort()
        .join(":")}`;

    const conversation = await ConversationModel.findOne({
        _id: conversationId,
    });
    if (!conversation || !conversation.messageIds) return [];

    const messages = await MessageModel.find({
        _id: { $in: conversation.messageIds },
        timestamp: { $lt: beforeTimestamp },
    })
        .sort({ timestamp: -1 })
        .limit(limit);

    return messages.reverse(); // để trả lại theo thứ tự cũ → mới
}

export async function deleteMessageAction({
    messageId,
}: DeleteMessageActionArgs) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();
        if (!user) return { success: false, message: "User not authenticated" };
        await MessageModel.findOneAndUpdate(
            { _id: messageId },
            { isDeleted: true }
        );
        await redis.hset(messageId, { isDeleted: true });

        return { success: true };
    } catch (error) {
        console.log(error);
        return { success: false };
    }
}
