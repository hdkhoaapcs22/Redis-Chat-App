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
    peer: PeerData | null;
    isCallEnded: boolean;
    handleJoinCall: (ongoingCall: OngoingCall) => void;
    handleHangup: (data: {
        ongoingCall?: OngoingCall;
        isEmitHangup?: boolean;
    }) => void;
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
    const [isCallEnded, setIsCallEnded] = useState<boolean>(false);
    const currentSocketUser = onlineUsers?.find(
        (onlineUser) => onlineUser.userId === user?.id
    );

    //CHECKED
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

    //CHECKED
    const handleCall = useCallback(
        async (userX: SocketUser) => {
            setIsCallEnded(false);
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

    //CHECKED
    const onIncomingCall = useCallback(
        (participants: Participants) => {
            setOngoingCall({
                participants,
                isRinging: true,
            });
        },
        [socket, user, ongoingCall]
    );

    //CHECKED
    const handleHangup = useCallback(
        (data: {
            ongoingCall?: OngoingCall | null;
            isEmitHangup?: boolean;
        }) => {
            if (socket && user && data?.ongoingCall && data?.isEmitHangup) {
                socket.emit("hangup", {
                    ongoingCall: data.ongoingCall,
                    userHangingupId: user.id,
                });
            }

            setOngoingCall(null);
            setPeer(null);
            if (localStream) {
                localStream.getTracks().forEach((track) => track.stop());
                setLocalStream(null);
            }
            setIsCallEnded(true);
        },
        [socket, user, localStream]
    );

    //CHECKED
    const createPeer = useCallback(
        (stream: MediaStream, initiator: boolean) => {
            console.log("create peer1");
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
            console.log("create peer2");
            const peer = new Peer({
                stream,
                initiator,
                trickle: true, // NOTE
                config: { iceServers },
            });
            // this stream event is when we receive the video data, audio data from the other person who like answers our offer
            // Khi bạn nhận được một MediaStream từ đối phương, simple-peer sẽ tự động phát ra sự kiện "stream", kèm theo stream đó.
            console.log("create peer3");

            peer.on("stream", (stream) => {
                console.log("STREAM IN STREAM", stream);
                setPeer((prevPeer) => {
                    if (prevPeer) {
                        return { ...prevPeer, stream };
                    }
                    return prevPeer;
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
    // CHECKED
    const completePeerConnection = useCallback(
        async (connectionData: {
            sdp: SignalData;
            ongoingCall: OngoingCall;
            isCaller: boolean;
        }) => {
            if (!localStream) {
                return;
            }

            if (peer) {
                peer.peerConnection?.signal(connectionData.sdp);
                return;
            }
            const newPeer = createPeer(localStream, true);

            setPeer({
                peerConnection: newPeer,
                participantUser:
                    connectionData.ongoingCall.participants.receiver,
                stream: undefined,
            });
            //"signal" không phải là do bạn tự định nghĩa,
            // mà là một sự kiện mặc định được phát ra bởi thư viện simple-peer
            console.log("completePeerConnection");
            newPeer.on("signal", async (data: SignalData) => {
                if (socket) {
                    // emit offer
                    console.log("signal completePeerConnection");
                    socket.emit("webrtcSignal", {
                        sdp: data,
                        ongoingCall,
                        isCaller: true,
                    });
                }
            });
        },
        [localStream, createPeer, peer, ongoingCall]
    );

    // CHECKED
    const handleJoinCall = useCallback(
        async (ongoingCall: OngoingCall) => {
            setIsCallEnded(false);
            setOngoingCall((prev) => {
                if (prev) {
                    return { ...prev, isRinging: false };
                }
                return prev;
            });

            const stream = await getMediaStream();
            if (!stream) {
                handleHangup({
                    ongoingCall: ongoingCall ? ongoingCall : undefined,
                    isEmitHangup: true,
                });
                return;
            }
            const newPeer = createPeer(stream, true);

            setPeer({
                peerConnection: newPeer,
                participantUser: ongoingCall.participants.caller,
                stream: undefined,
            });
            console.log("handleJoinCall");
            newPeer.on("signal", async (data: SignalData) => {
                console.log("signal handleJoinCall");
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
        const newSocket = io(); // since socket server has the same http with the nextjs application -> don't need to pass the URL
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    //setIsSocketConnected
    useEffect(() => {
        if (socket === null) return;

        if (socket.connected) {
            onConnect();
        }

        if (socket.disconnected) {
            onDisconnect();
        }

        function onConnect() {
            setIsSocketConnected(true);
        }

        function onDisconnect() {
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

    // listen calls
    useEffect(() => {
        if (!socket || !isSocketConnected) return;

        socket.on("incomingCall", onIncomingCall);
        socket.on("webrtcSignal", completePeerConnection);
        socket.on("hangup", handleHangup);
        return () => {
            socket.off("incomningCall", onIncomingCall);
            socket.off("webrtcSignal", completePeerConnection);
            socket.off("hangup", handleHangup);
        };
    }, [socket, isSocketConnected, user, onIncomingCall, completePeerConnection]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        if (isCallEnded) {
            timeout = setTimeout(() => {
                setIsCallEnded(false);
            }, 2000);
        }

        return () => clearTimeout(timeout);
    }, [isCallEnded]);

    return (
        <SocketContext.Provider
            value={{
                onlineUsers,
                ongoingCall,
                localStream,
                peer,
                isCallEnded,
                handleCall,
                handleJoinCall,
                handleHangup,
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
