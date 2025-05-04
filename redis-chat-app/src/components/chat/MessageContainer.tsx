"use client";

import React, { useEffect } from "react";
import ChatBottomBar from "./ChatBottomBar";
import MessageList from "./MessageList";
import ChatTopBar from "./ChatTopbar";
import { useSelectedUser } from "@/store/useSelectedUser";
import { useQuery } from "@tanstack/react-query";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { getMessageAction } from "@/actions/message.action";
import { Message } from "@/db/types";

const MessageContainer = () => {
    const { setSelectedUser } = useSelectedUser();

    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            setSelectedUser(null);
        }
    };

    useEffect(() => {
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [setSelectedUser]);

    const { selectedUser } = useSelectedUser();
    const { user: currentUser, isLoading: isUserLoading } =
        useKindeBrowserClient();

    const { data: messages, isLoading: isMessagesLoading } = useQuery({
        queryKey: ["messages", selectedUser?._id],
        queryFn: async () => {
            if (selectedUser && currentUser) {
                return await getMessageAction(selectedUser?._id, currentUser?.id);
            }
        },
        enabled: !!selectedUser && !!currentUser && !isUserLoading,
    });
    console.log("Message container is created");
    return (
        <div className="flex flex-col justify-between w-full h-full">
            <ChatTopBar />
            <div className="w-full overflow-y-auto overflow-x-auto h-full flex flex-col">
                <MessageList
                    messages={messages as Message[]}
                    currentUser={currentUser!}
                    selectedUser={selectedUser!}
                    isMessagesLoading={isMessagesLoading}
                />
                <ChatBottomBar
                    currentUser={currentUser!}
                    selectedUser={selectedUser!}
                    isMessagesLoading={isMessagesLoading}
                />
            </div>
        </div>
    );
};

export default MessageContainer;
