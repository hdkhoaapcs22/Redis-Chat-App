import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";

export type SocketUser = {
    userId: string;
    socketId: string;
    profile: KindeUser;
};
