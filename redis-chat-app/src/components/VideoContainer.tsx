import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

type iVideoContainer = {
    stream: MediaStream | null;
    isLocalStream: boolean;
    isOnCall: boolean; // if other user accepts the call
};

const VideoContainer = ({
    stream,
    isLocalStream,
    isOnCall,
}: iVideoContainer) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            className={cn(
                "rounded border w-[800px]",
                isLocalStream &&
                    isOnCall &&
                    "w-[200px] h-auto absolute border-purple-500 border-2"
            )}
            autoPlay
            playsInline
            ref={videoRef}
            muted={isLocalStream}
        />
    );
};

export default VideoContainer;
