"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarImage } from "../ui/avatar";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { useEffect, useRef } from "react";
import MessageSkeleton from "@/skeleton/MessageSkeleton";
import { Message, User } from "@/db/types";
import { EllipsisVertical } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

type MessageListProps = {
    messages: Message[];
    isMessagesLoading: boolean;
    currentUser: KindeUser;
    selectedUser: User;
};

const MessageList = ({
    messages,
    isMessagesLoading,
    currentUser,
    selectedUser,
}: MessageListProps) => {
    const messageContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to the bottom of the message container when new messages are added
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop =
                messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleEditMessage = (message: Message) => {
        console.log("Edit:", message);
    };

    const handleDeleteMessage = (messageId: string) => {
        console.log("Delete:", messageId);
    };

    const handleReactToMessage = (message: Message) => {
        console.log("React to:", message);
    };

    return (
        <div
            ref={messageContainerRef}
            className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col"
        >
            {/* This component ensure that an animation is applied when items are added to or removed from the list */}
            <AnimatePresence>
                {!isMessagesLoading &&
                    messages?.map((message, index) => (
                        <motion.div
                            key={index}
                            layout
                            initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
                            transition={{
                                opacity: { duration: 0.1 },
                                layout: {
                                    type: "spring",
                                    bounce: 0.3,
                                    duration:
                                        messages.indexOf(message) * 0.05 + 0.2,
                                },
                            }}
                            style={{
                                originX: 0.5,
                                originY: 0.5,
                            }}
                            className={cn(
                                "flex flex-col gap-2 p-4 whitespace-pre-wrap",
                                message.senderId === currentUser?.id
                                    ? "items-end"
                                    : "items-start"
                            )}
                        >
                            <div className="flex gap-3 items-center">
                                {message.senderId === selectedUser?._id && (
                                    <Avatar className="flex justify-center items-center">
                                        <AvatarImage
                                            src={selectedUser?.image}
                                            alt="User Image"
                                            className="border-2 border-white rounded-full"
                                        />
                                    </Avatar>
                                )}
                                <div className="flex items-center max-w-full group">
                                    {message.messageType === "text" ? (
                                        <span className="bg-accent p-3 rounded-md max-w-xs break-words">
                                            {message.content}
                                        </span>
                                    ) : (
                                        <img
                                            src={message.content}
                                            alt="Message Image"
                                            className="border p-2 rounded h-40 md:h-52 object-cover"
                                        />
                                    )}

                                    {/* Inline Action Buttons (shown on hover) */}
                                    {message.senderId === selectedUser?._id && (
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() =>
                                                    handleReactToMessage(
                                                        message
                                                    )
                                                }
                                                className="text-sm p-1 rounded-full hover:bg-muted"
                                            >
                                                😊
                                            </button>

                                            <Menu
                                                as="div"
                                                className="relative inline-block text-left"
                                            >
                                                <MenuButton className="p-1 rounded-full hover:bg-muted">
                                                    <EllipsisVertical className="w-4 h-4" />
                                                </MenuButton>

                                                <MenuItems className="absolute right-0 mt-1 w-28 origin-top-right bg-white border rounded shadow-lg z-50">
                                                    <div className="py-1 text-sm text-gray-700">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() =>
                                                                        handleEditMessage(
                                                                            message
                                                                        )
                                                                    }
                                                                    className={`w-full text-left px-3 py-2 ${
                                                                        active
                                                                            ? "bg-gray-100"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    ✏️ Edit
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteMessage(
                                                                            message._id
                                                                        )
                                                                    }
                                                                    className={`w-full text-left px-3 py-2 ${
                                                                        active
                                                                            ? "bg-gray-100"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    🗑️ Remove
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                </MenuItems>
                                            </Menu>
                                        </div>
                                    )}
                                </div>

                                {message.senderId === currentUser?.id && (
                                    <Avatar className="flex justify-center items-center">
                                        <AvatarImage
                                            src={
                                                currentUser?.picture ||
                                                "/user-placeholder.png"
                                            }
                                            alt="User Image"
                                            className="border-2 border-white rounded-full"
                                        />
                                    </Avatar>
                                )}
                            </div>
                        </motion.div>
                    ))}

                {isMessagesLoading && (
                    <>
                        <MessageSkeleton />
                        <MessageSkeleton />
                        <MessageSkeleton />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
export default MessageList;
