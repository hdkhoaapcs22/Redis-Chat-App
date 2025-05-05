"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarImage } from "../ui/avatar";
import { KindeUser, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import MessageSkeleton from "@/skeleton/MessageSkeleton";
import { Message, User } from "@/db/types";
import { EllipsisVertical } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    deleteMessageAction,
    getMessageAction,
} from "@/actions/message.action";
import { pusherClient } from "@/lib/pusher";

type MessageListProps = {
    currentUser: KindeUser;
    selectedUser: User;
    isUserLoading: boolean;
};

const MessageList = ({
    selectedUser,
    currentUser,
    isUserLoading,
}: MessageListProps) => {
    const messageContainerRef = useRef<HTMLDivElement>(null);
    // Scroll to the bottom of the message container when new messages are added

    const handleEditMessage = (message: Message) => {
        console.log("Edit:", message);
    };

    const { mutate: deleteMessage, isPending } = useMutation({
        mutationFn: deleteMessageAction,
        // onMutate runs before mutation request is sent.
        onMutate: async ({ messageId }) => {
            // Stops ongoing queries for messages for the selected user to avoid overwrite
            await queryClient.cancelQueries({
                queryKey: ["messages", selectedUser._id],
            });

            // Stores the current message list in case the mutation fails (for rollback).
            const previousMessages = queryClient.getQueryData<Message[]>([
                "messages",
                selectedUser._id,
            ]);

            // mark deleted
            queryClient.setQueryData(
                ["messages", selectedUser._id],
                (old: Message[] | undefined) =>
                    old?.map((msg) =>
                        msg._id === messageId
                            ? { ...msg, isDeleted: true }
                            : msg
                    ) || []
            );

            return { previousMessages };
        },
        // This runs if the mutation fails.
        onError: (err, _vars, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(
                    ["messages", selectedUser._id],
                    context.previousMessages
                );
            }
        },
        //This runs after the mutation completes, whether it failed or succeeded.
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["messages", selectedUser._id],
            });
        },
    });

    const handleDeleteMessage = (messageId: string) => {
        console.log("Delete:", messageId);
        deleteMessage({
            receiverId: selectedUser._id,
            messageId,
        });
    };

    const { data: messages, isLoading: isMessagesLoading } = useQuery({
        queryKey: ["messages", selectedUser?._id],
        queryFn: async () => {
            if (selectedUser && currentUser) {
                return await getMessageAction(
                    selectedUser?._id,
                    currentUser?.id
                );
            }
        },
        enabled: !!selectedUser && !!currentUser && !isUserLoading,
    });

    const channelName = useMemo(() => {
        return `${currentUser.id}__${selectedUser._id}`
            .split("__")
            .sort()
            .join("__");
    }, [currentUser.id, selectedUser._id]);

    const queryClient = useQueryClient();
    useEffect(() => {
        const channel = pusherClient.subscribe("deleteMessage__" + channelName);

        const handleDeletedMessage = (data: { _id: string }) => {
            queryClient.setQueryData<Message[]>(
                ["messages", selectedUser._id],
                (oldMessages) => {
                    if (!oldMessages) return [];
                    return oldMessages.map((msg) =>
                        msg._id === data._id ? { ...msg, isDeleted: true } : msg
                    );
                }
            );
        };
        channel.bind("deleteMessage", handleDeletedMessage);

        return () => {
            channel.unbind("deleteMessage", handleDeletedMessage);
            pusherClient.unsubscribe("deleteMessage__" + channelName);
        };
    }, [channelName]);

    const handleReactToMessage = (message: Message) => {
        console.log("React to:", message);
    };

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop =
                messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div
            ref={messageContainerRef}
            className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col"
        >
            {/* This component ensure that an animation is applied when items are added to or removed from the list */}
            <AnimatePresence>
                {!isMessagesLoading &&
                    messages &&
                    messages.map((message, index) => (
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
                                message?.senderId === currentUser?.id
                                    ? "items-end"
                                    : "items-start"
                            )}
                        >
                            <div className="flex gap-3 items-center">
                                {message?.senderId === selectedUser?._id && (
                                    <Avatar className="flex justify-center items-center">
                                        <AvatarImage
                                            src={selectedUser?.image}
                                            alt="User Image"
                                            className="border-2 border-white rounded-full"
                                        />
                                    </Avatar>
                                )}
                                <div className="flex items-center max-w-full group gap-1">
                                    {message?.senderId == currentUser?.id && (
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                                    disabled={
                                                                        isPending
                                                                    }
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

                                    {!message?.isDeleted ? (
                                        message?.messageType === "text" ? (
                                            <span className="bg-accent p-3 rounded-md max-w-xs break-words">
                                                {message?.content}
                                            </span>
                                        ) : (
                                            <img
                                                src={message?.content}
                                                alt="Message Image"
                                                className="border p-2 rounded h-40 md:h-52 object-cover"
                                            />
                                        )
                                    ) : (
                                        <div className="rounded-md p-5 bg-transparent break-word border-2">
                                            The message was deleted
                                        </div>
                                    )}

                                    {message?.senderId ===
                                        selectedUser?._id && (
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
                                        </div>
                                    )}
                                </div>

                                {message?.senderId === currentUser?.id && (
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

                {(isMessagesLoading || !messages) && (
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
