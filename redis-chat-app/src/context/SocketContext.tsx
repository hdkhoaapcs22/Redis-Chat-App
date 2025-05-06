import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Socket, io } from "socket.io-client";
import { createContext, useContext, useEffect, useState } from "react";
import { SocketUser } from "@/types";

type iSocketContext = {};

export const SocketContext = createContext<iSocketContext | null>(null);

export const SocketContextProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { user } = useKindeBrowserClient();
    const [onlineUsers, setOnlineUsers] = useState<SocketUser | null>(null);
    console.log(user);
    console.log("isconnected>>", isSocketConnected);
    console.log("ONline users: ", onlineUsers);
    // initialize a socket
    useEffect(() => {
        console.log("In first useEffect");
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

    return <SocketContext.Provider value={{}}></SocketContext.Provider>;
};

export const useSocket = () => {
    const context = useContext(SocketContext);

    if (context === null) {
        throw new Error("useSocket must be used within a SocketContextProvide");
    }

    return context;
};
