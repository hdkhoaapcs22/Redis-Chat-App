"use client";

import { useSocket } from "@/context/SocketContext";
import VideoContainer from "./VideoContainer";
import { useCallback, useEffect, useState } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

const VideoCall = () => {
    const { localStream, peer, ongoingCall, handleHangup, isCallEnded } =
        useSocket();
    const [isVidCon, setIsVidOn] = useState<boolean>(true);
    const [isMicOn, setIsMicOn] = useState<boolean>(true);

    useEffect(() => {
        if (!localStream) return;
        const videoTrack = localStream.getVideoTracks()[0];
        setIsVidOn(videoTrack.enabled);
        const audioTrack = localStream.getAudioTracks()[0];
        setIsMicOn(audioTrack.enabled);
    }, [localStream]);

    const toggleCamera = useCallback(() => {
        if (!localStream) return;
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        setIsVidOn(videoTrack.enabled);
    }, [localStream]);

    const toggleMic = useCallback(() => {
        if (!localStream) return;
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
    }, [localStream]);

    const isOnCall = localStream && peer && ongoingCall ? true : false;

    if (isCallEnded) {
        return (
            <div className="mt-5 text-rose-500 text-center"> Call Ended</div>
        );
    }

    if (!localStream && !peer) return;
    console.log("PEER in VIDEOCALL", peer);
    console.log("PEER.STREAM in VIDEOCALL", peer?.stream);
    return (
        <div className="mt-4 relative">
            <div>
                {/** the local stream of caller */}
                {localStream && (
                    <VideoContainer
                        stream={localStream}
                        isLocalStream={true}
                        isOnCall={isOnCall}
                    />
                )}
                {/** share the video for the other person */}
                {peer && peer.stream && (
                    <VideoContainer
                        stream={peer.stream}
                        isLocalStream={false}
                        isOnCall={isOnCall}
                    />
                )}
            </div>
            <div className="mt-8 flex items-center justify-center">
                <button onClick={toggleMic}>
                    {!isMicOn ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                <button
                    className="px-4 py-2 cursor-pointer bg-rose-500 text-white rounded mx-4"
                    onClick={() => {
                            handleHangup({
                                ongoingCall: ongoingCall
                                    ? ongoingCall
                                    : undefined,
                                isEmitHangup: true,
                            });
                    }}
                >
                    End call
                </button>
                <button onClick={toggleCamera}>
                    {!isVidCon ? <VideoOff size={28} /> : <Video size={28} />}
                </button>
            </div>
        </div>
    );
};

export default VideoCall;
