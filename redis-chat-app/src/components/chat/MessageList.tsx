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
    editMessageAction,
    getMessageAction,
} from "@/actions/message.action";
import { pusherClient } from "@/lib/pusher";
import { Textarea } from "../ui/textarea";

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
    const queryClient = useQueryClient();

    // retrieve message section
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

    // channelName section
    const channelName = useMemo(() => {
        return `${currentUser.id}__${selectedUser._id}`
            .split("__")
            .sort()
            .join("__");
    }, [currentUser.id, selectedUser._id]);

    // scroll section
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop =
                messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // delete section
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

    // handle bind delete message
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

    // Edit section
    const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null
    );
    const [editingContent, setEditingContent] = useState<string>("");
    const { mutate: EditMessage } = useMutation({
        mutationFn: editMessageAction,
        // onMutate runs before mutation request is sent.
        onMutate: async ({ messageId, newContent }) => {
            // Stops ongoing queries for messages for the selected user to avoid overwrite
            await queryClient.cancelQueries({
                queryKey: ["messages", selectedUser._id],
            });

            // Stores the current message list in case the mutation fails (for rollback).
            const previousMessages = queryClient.getQueryData<Message[]>([
                "messages",
                selectedUser._id,
            ]);

            // mark editted
            queryClient.setQueryData(
                ["messages", selectedUser._id],
                (old: Message[] | undefined) =>
                    old?.map((msg) =>
                        msg._id === messageId
                            ? { ...msg, isEditted: true, content: newContent }
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

    const handleEditMessage = (message: Message) => {
        setEditingMessageId(message._id);
        setEditingContent(message.content);
    };

    const saveEditedMessage = (message: Message) => {
        console.log("save Edited Message 1");
        if (editingMessageId !== null && message.content != editingContent) {
            console.log("save Edited Message 2");
            EditMessage({
                messageId: editingMessageId,
                receiverId: selectedUser._id,
                newContent: editingContent,
            });
        }
        setEditingMessageId(null);
        setEditingContent("");
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditingContent("");
    };

    useEffect(() => {
        const channel = pusherClient.subscribe("editMessage__" + channelName);

        const handleEditedMessage = (data: {
            _id: string;
            newContent: string;
        }) => {
            queryClient.setQueryData<Message[]>(
                ["messages", selectedUser._id],
                (oldMessages) => {
                    if (!oldMessages) return [];
                    return oldMessages.map((msg) =>
                        msg._id === data._id
                            ? {
                                  ...msg,
                                  isEditted: true,
                                  content: data.newContent,
                              }
                            : msg
                    );
                }
            );
        };
        channel.bind("editMessage", handleEditedMessage);

        return () => {
            channel.unbind("editMessage", handleEditedMessage);
            pusherClient.unsubscribe("editMessage__" + channelName);
        };
    }, [channelName]);

    // react section
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
                            {/* selected user avatar*/}
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
                                                        {message.messageType ===
                                                            "text" &&
                                                            !message.isEditted && (
                                                                <MenuItem>
                                                                    {({
                                                                        active,
                                                                    }) => (
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
                                                                            ✏️
                                                                            Edit
                                                                        </button>
                                                                    )}
                                                                </MenuItem>
                                                            )}
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
                                        message?._id != editingMessageId &&
                                        (message?.messageType === "text" ? (
                                            <div className="relative px-3 py-4">
                                                <span className=" bg-accent p-3 rounded-md max-w-xs break-words">
                                                    {message?.content}
                                                    {message.isEditted && (
                                                        <span className="absolute left-1 top-0 text-[10px] text-blue-500">
                                                            Edited
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        ) : (
                                            <img
                                                src={message?.content}
                                                alt="Message Image"
                                                className="border p-2 rounded h-40 md:h-52 object-cover"
                                            />
                                        ))
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

                                {/* edit area*/}
                                {editingMessageId === message?._id && (
                                    <div className="flex flex-col gap-1">
                                        <textarea
                                            value={editingContent}
                                            onChange={(e) =>
                                                setEditingContent(
                                                    e.target.value
                                                )
                                            }
                                            className="p-2 border rounded w-full"
                                        />
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() =>
                                                    saveEditedMessage(message)
                                                }
                                                className="px-3 py-1 text-white bg-blue-500 rounded"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="px-3 py-1 text-gray-700 bg-gray-200 rounded"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* current user avatar*/}
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
