import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Textarea } from "../ui/textarea";
import { ImageIcon, Loader, SendHorizontal, ThumbsUp } from "lucide-react";
import EmojiPicker from "./EmojiPicker";
import { Button } from "../ui/button";
import useSound from "use-sound";
import { usePreferences } from "@/store/usePreferences";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessageAction } from "@/actions/message.action";
import { CldUploadWidget, CloudinaryUploadWidgetInfo } from "next-cloudinary";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import Image from "next/image";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { Message, User } from "@/db/types";
import { pusherClient } from "@/lib/pusher";

type ChatBottomBar = {
    selectedUser: User;
    currentUser: KindeUser;
};

const ChatBottomBar = ({ selectedUser, currentUser }: ChatBottomBar) => {
    console.log("ChatBottomBar is created");
    const [message, setMessage] = useState("");
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [imageUrl, setImageUrl] = useState("");
    const queryClient = useQueryClient();

    const [playSound1] = useSound("/sounds/keystroke1.mp3");
    const [playSound2] = useSound("/sounds/keystroke2.mp3");
    const [playSound3] = useSound("/sounds/keystroke3.mp3");
    const [playSound4] = useSound("/sounds/keystroke4.mp3");
    const playNotificationSound = () => {
        const audio = new Audio("/sounds/notification.mp3");
        audio.play();
    };
    const { soundEnabled } = usePreferences();

    const playSoundFunctions = [playSound1, playSound2, playSound3, playSound4];
    const { mutate: sendMessage, isPending } = useMutation({
        mutationFn: sendMessageAction,
    });

    const playRandomKeyStrokeSound = useCallback(() => {
        const randomIndex = Math.floor(
            Math.random() * playSoundFunctions.length
        );
        soundEnabled && playSoundFunctions[randomIndex]();
    }, []);

    const handleSendMessage = useCallback(() => {
        if (!message.trim()) return;
        sendMessage({
            content: message,
            messageType: "text",
            receiverId: selectedUser?._id,
        });
        setMessage("");
        textAreaRef.current?.focus();
    }, [selectedUser._id, message]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        } else if (e.key === "Enter" && e.shiftKey) {
            setMessage(message + "\n");
        }
    };

    const handleThumbsUp = useCallback(() => {
        sendMessage({
            content: "👍",
            messageType: "text",
            receiverId: selectedUser?._id!,
        });
    }, [selectedUser._id]);

    const handleSendImageMessage = useCallback(() => {
        if (!imageUrl) return;
        sendMessage({
            content: imageUrl,
            messageType: "image",
            receiverId: selectedUser?._id!,
        });
        setImageUrl("");
    }, [imageUrl, selectedUser._id]);

    const channelName = useMemo(() => {
        return [currentUser?.id, selectedUser?._id].sort().join("__");
    }, [currentUser?.id, selectedUser?._id]);

    useEffect(() => {
        const channel = pusherClient?.subscribe(channelName);

        const handleNewMessage = (data: { message: Message }) => {
            queryClient.setQueryData(
                ["messages", selectedUser?._id],
                (oldMessages: Message[]) => [...oldMessages, data.message]
            );
            if (soundEnabled && data.message.senderId !== currentUser?.id) {
                console.log("Notification");
                playNotificationSound();
            }
        };

        channel?.bind("newMessage", handleNewMessage);

        return () => {
            channel?.unbind("newMessage", handleNewMessage);
            pusherClient?.unsubscribe(channelName);
        };
    }, [channelName, soundEnabled]);

    return (
        <div className="p-2 flex justify-between w-full items-center gap-2">
            {!message.trim() && (
                <CldUploadWidget
                    signatureEndpoint={"/api/sign-cloudinary-params"}
                    onSuccess={(result, { widget }) => {
                        setImageUrl(
                            (result.info as CloudinaryUploadWidgetInfo)
                                .secure_url
                        );
                        widget.close();
                    }}
                >
                    {({ open }) => {
                        return (
                            <ImageIcon
                                size={20}
                                onClick={() => {
                                    if (!isPending) open();
                                }}
                                className={`cursor-pointer ${
                                    isPending
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-muted-foreground"
                                }`}
                            />
                        );
                    }}
                </CldUploadWidget>
            )}

            {imageUrl !== "" && (
                <Dialog open={!!imageUrl}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Image Preview</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center items-center relative h-96 w-full mx-auto">
                            <Image
                                src={imageUrl}
                                alt="Image Preview"
                                fill
                                className="object-contain"
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={isPending}
                                onClick={handleSendImageMessage}
                            >
                                Send
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <AnimatePresence>
                <motion.div
                    layout
                    key="textarea"
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1 }}
                    transition={{
                        opacity: { duration: 0.5 },
                        layout: {
                            type: "spring",
                            bounce: 0.15,
                        },
                    }}
                    className="w-full relative"
                >
                    <Textarea
                        autoComplete="off"
                        placeholder="Aa"
                        disabled={isPending}
                        rows={1}
                        value={message}
                        ref={textAreaRef}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            playRandomKeyStrokeSound();
                        }}
                        className="w-full border rounded-full flex items-center h-9 resize-none overflow-hidden bg-background min-h-0"
                    />
                    <div className="absolute bottom-1 right-1.5">
                        <EmojiPicker
                            onChange={(emoji) => {
                                setMessage(message + emoji);
                                if (textAreaRef.current) {
                                    textAreaRef.current.focus();
                                }
                            }}
                        />
                    </div>
                </motion.div>
                {message.trim() ? (
                    <Button
                        className="h-9 w-9 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white shrink-0 cursor-pointer"
                        variant={"ghost"}
                        size={"icon"}
                        key="send"
                        onClick={handleSendMessage}
                        disabled={isPending}
                    >
                        <SendHorizontal
                            size={20}
                            className="text-muted-foreground"
                        />
                    </Button>
                ) : (
                    <Button
                        className="h-9 w-9 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white shrink-0 cursor-pointer"
                        variant={"ghost"}
                        size={"icon"}
                        onClick={handleThumbsUp}
                        disabled={isPending}
                    >
                        {!isPending && (
                            <ThumbsUp
                                size={20}
                                className="text-muted-foreground"
                            />
                        )}
                        {isPending && (
                            <Loader size={20} className="animate-spin" />
                        )}
                    </Button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatBottomBar;
