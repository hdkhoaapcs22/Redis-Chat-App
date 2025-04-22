import React, { useEffect } from "react";
import ChatBottomBar from "./ChatBottomBar";
import MessageList from "./MessageList";
import ChatTopBar from "./ChatTopbar";
import { useSelectedUser } from "@/store/useSelectedUser";

const MessageContainer = () => {
    const { setSelectedUser } = useSelectedUser();

    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            setSelectedUser(null);
        }
    };

    useEffect(() => {
        document.addEventListener("keydown", (e) => handleEscape);
        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [setSelectedUser]);

    return (
        <div className="flex flex-col justify-between w-full h-full">
            <ChatTopBar />
            <div className="w-full overflow-y-auto overflow-x-auto h-full flex flex-col">
                <MessageList />
                <ChatBottomBar />
            </div>
        </div>
    );
};

export default MessageContainer;
