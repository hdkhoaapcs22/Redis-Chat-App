"use client";

import { useSocket } from "@/context/SocketContext";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { Phone, PhoneMissed } from "lucide-react";

const CallNotification = () => {
    const { ongoingCall, handleJoinCall, handleHangup } = useSocket();

    if (!ongoingCall?.isRinging) return;

    return (
        <div className="absolute z-50 bg-slate-400 w-screen h-screen top-0 bottom-0 left-0 flex items-center justify-center">
            <div className="bg-white min-w-[300px] min-h-[100px] flex flex-col items-center justify-center rounded p-4">
                <div className="flex flex-col items-center">
                    <Avatar>
                        <AvatarImage
                            src={
                                ongoingCall.participants.caller.profile
                                    .picture || "/user-placeholder.png"
                            }
                            alt="User Image"
                            className="border-2 border-white rounded-full"
                        />
                    </Avatar>
                    <h3 className="text-gray-600">
                        {ongoingCall.participants.caller.profile.given_name}{" "}
                        {ongoingCall.participants.caller.profile.family_name}
                    </h3>
                </div>
                <p className="test-sm mb-2 text-gray-600">Incoming Call</p>
                <div className="flex gap-8">
                    <button
                        onClick={() => handleJoinCall(ongoingCall)}
                        className="w-12 bg-green-500 rounded-full flex items-center justify-center text-white"
                    >
                        <Phone size={24} />
                    </button>
                    <button
                        onClick={() => {
                                handleHangup({
                                    ongoingCall: ongoingCall
                                        ? ongoingCall
                                        : undefined,
                                    isEmitHangup: true,
                                });
                        }}
                        className="w-12 bg-red-500 rounded-full flex items-center justify-center text-white cursor-pointer"
                    >
                        <PhoneMissed size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallNotification;
