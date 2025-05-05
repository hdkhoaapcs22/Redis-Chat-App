"use client";

import React, { useEffect } from "react";
import ChatBottomBar from "./ChatBottomBar";
import MessageList from "./MessageList";
import ChatTopBar from "./ChatTopbar";
import { useSelectedUser } from "@/store/useSelectedUser";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

const MessageContainer = () => {
    const { selectedUser, setSelectedUser } = useSelectedUser();
    const { user: currentUser, isLoading: isUserLoading } =
        useKindeBrowserClient();
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

    if(!selectedUser || !currentUser)   return null;

    console.log("Message container is created");
    return (
        <div className="flex flex-col justify-between w-full h-full">
            <ChatTopBar />
            <div className="w-full overflow-y-auto overflow-x-auto h-full flex flex-col">
                <MessageList
                    selectedUser={selectedUser}
                    currentUser={currentUser}
                    isUserLoading={isUserLoading!}
                />
                <ChatBottomBar
                    currentUser={currentUser}
                    selectedUser={selectedUser}
                />
            </div>
        </div>
    );
};

export default MessageContainer;
