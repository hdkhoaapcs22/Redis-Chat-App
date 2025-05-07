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
            className="rounded border w-[800px]"
            autoPlay
            playsInline
            ref={videoRef}
            muted={isLocalStream}
        />
    );
};

export default VideoContainer;
