"use client";

import { useSocket } from "@/context/SocketContext";
import VideoContainer from "./VideoContainer";
import { useCallback, useEffect, useState } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

const VideoCall = () => {
    const { localStream } = useSocket();
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
        setIsVidOn(audioTrack.enabled);
    }, [localStream]);

    return (
        <div>
            <div>
                {localStream && (
                    <VideoContainer
                        stream={localStream}
                        isLocalStream={true}
                        isOnCall={false}
                    />
                )}
            </div>
            <div className="mt-8 flex items-center justify-center">
                <button onClick={toggleMic}>
                    {isMicOn ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                <button
                    className="px-4 py-2 bg-rose-500 text-white rounded mx-4"
                    onClick={() => {}}
                >
                    End call
                </button>
                <button onClick={toggleCamera}>
                    {isVidCon ? <VideoOff size={28} /> : <Video size={28} />}
                </button>
            </div>
        </div>
    );
};

export default VideoCall;
