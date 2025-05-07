import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import Peer from "simple-peer";

export type SocketUser = {
    userId: string;
    socketId: string;
    profile: KindeUser;
};

export type OngoingCall = {
    participants: Participants;
    isRinging: boolean;
};

export type Participants = {
    caller: SocketUser;
    receiver: SocketUser;
};

export type PeerData = {
    peerConnection: Peer.Instance;
    stream: MediaStream | undefined;
    participantUser: SocketUser;
};
