import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Socket, io } from "socket.io-client";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { OngoingCall, Participants, PeerData, SocketUser } from "@/types";
import Peer, { SignalData } from "simple-peer";

type iSocketContext = {
    onlineUsers: SocketUser[] | null;
    handleCall: (user: SocketUser) => void;
    ongoingCall: OngoingCall | null;
    localStream: MediaStream | null;
    handleJoinCall: (ongoingCall: OngoingCall) => void;
};

export const SocketContext = createContext<iSocketContext | null>(null);

export const SocketContextProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { user } = useKindeBrowserClient();
    const [onlineUsers, setOnlineUsers] = useState<SocketUser[] | null>(null);
    const [ongoingCall, setOngoingCall] = useState<OngoingCall | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peer, setPeer] = useState<PeerData | null>(null);

    const currentSocketUser = onlineUsers?.find(
        (onlineUser) => onlineUser.userId === user?.id
    );

    const getMediaStream = useCallback(
        async (faceMode?: string) => {
            if (localStream) return localStream;

            try {
                const devices = await navigator.mediaDevices.enumerateDevices(); // a list of available media input and output devices: microphones, cameras, headsets, and so forth.
                const videoDevices = devices.filter(
                    (device) => device.kind === "videoinput"
                );

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: {
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 360, ideal: 720, max: 1080 },
                        frameRate: { min: 16, ideal: 30, max: 30 },
                        facingMode:
                            videoDevices.length > 0 ? faceMode : undefined,
                    },
                });
                setLocalStream(stream);
                return stream;
            } catch (error) {
                console.log(error);
                setLocalStream(null);
                return null;
            }
        },
        [localStream]
    );

    const handleCall = useCallback(
        async (userX: SocketUser) => {
            if (!currentSocketUser || !socket) return;

            const stream = await getMediaStream();
            if (!stream) {
                console.log("No stream in handleCall");
                return;
            }

            const participants = { caller: currentSocketUser, receiver: userX };
            setOngoingCall({
                participants,
                isRinging: false,
            });
            socket.emit("call", participants);
        },
        [socket, currentSocketUser, ongoingCall]
    );

    const oncomingCall = useCallback(
        (participants: Participants) => {
            setOngoingCall({
                participants,
                isRinging: true,
            });
        },
        [socket, user, ongoingCall]
    );

    console.log("Online users: ", onlineUsers);

    const handleHangup = useCallback(({}) => {}, []);

    const createPeer = useCallback(
        (stream: MediaStream, initiator: boolean) => {
            const iceServers: RTCIceServer[] = [
                {
                    urls: [
                        "stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                        "stun:stun3.l.google.com:19302",
                    ],
                },
            ];

            const peer = new Peer({
                stream,
                initiator,
                trickle: true, // NOTE
                config: { iceServers },
            });
            // this stream event is when we receive the video data, audio data from the other person who like answers our offer
            peer.on("stream", (stream) => {
                console.log("The stream event of peer is called");
                setPeer((prev) => {
                    if (prev) {
                        return { ...prev, stream };
                    }
                    return prev;
                });
            });
            peer.on("error", console.error);
            peer.on("close", () => handleHangup({}));

            const rtcPeerConnection: RTCPeerConnection = (peer as any)._pc;
            rtcPeerConnection.oniceconnectionstatechange = async () => {
                if (
                    rtcPeerConnection.iceConnectionState === "disconnected" ||
                    rtcPeerConnection.iceConnectionState === "failed"
                ) {
                    handleHangup({});
                }
            };

            return peer;
        },
        [ongoingCall, setPeer]
    );

    const handleJoinCall = useCallback(
        async (ongoingCall: OngoingCall) => {
            setOngoingCall((prev) => {
                if (prev) {
                    return { ...prev, isRinging: false };
                }
                return prev;
            });

            const stream = await getMediaStream();
            if (!stream) {
                console.log("Cound not get stream in handleJoinCall");
                return;
            }

            const newPeer = createPeer(stream, true);

            setPeer({
                peerConnection: newPeer,
                participantUser: ongoingCall.participants.caller,
                stream: undefined,
            });

            newPeer.on("signal", async (data: SignalData) => {
                console.log("The signal event of newPeer is called");
                if (socket) {
                    // emit offer
                    socket.emit("webrtcSignal", {
                        sdp: data,
                        ongoingCall,
                        isCaller: false,
                    });
                }
            });  
        },
        [socket, currentSocketUser]
    );

    // initialize a socket
    useEffect(() => {
        console.log("User: ", user);
        const newSocket = io(); // since socket server has the same http with the nextjs application -> don't need to pass the URL
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        console.log("In second useEffect");
        if (socket === null) return;

        if (socket.connected) {
            onConnect();
        }

        if (socket.disconnected) {
            onDisconnect();
        }

        function onConnect() {
            console.log("In connect");
            setIsSocketConnected(true);
        }

        function onDisconnect() {
            console.log("In disconnect");
            setIsSocketConnected(false);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, [socket]);

    //set online user
    useEffect(() => {
        if (!socket || !isSocketConnected) return;

        socket.emit("addNewUser", user);
        socket.on("getUsers", (res) => {
            setOnlineUsers(res);
        });

        return () => {
            socket.off("getUsers", (res) => {
                setOnlineUsers(res);
            });
        };
    }, [socket, isSocketConnected, user]);

    // listen incoming call
    useEffect(() => {
        if (!socket || !isSocketConnected) return;

        socket.on("incomingCall", oncomingCall);

        return () => {
            socket.off("incomningCall", oncomingCall);
        };
    }, [socket, isSocketConnected, user, oncomingCall]);

    return (
        <SocketContext.Provider
            value={{
                onlineUsers,
                handleCall,
                ongoingCall,
                localStream,
                handleJoinCall,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);

    if (context === null) {
        throw new Error("useSocket must be used within a SocketContextProvide");
    }

    return context;
};
