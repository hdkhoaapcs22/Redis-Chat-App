"use client";

import { useEffect, useState } from "react";
import ChatLayout from "./chat/ChatLayout";
import { User } from "@/db/types";

export default function ChatWrapper({ users }: { users: User[] }) {
    const [defaultLayout, setDefaultLayout] = useState<any>(undefined);

    useEffect(() => {
        const layout = localStorage.getItem("react-resizable-panels: layout");
        if (layout) {
            try {
                setDefaultLayout(JSON.parse(layout));
            } catch (err) {
                console.error("Failed to parse layout:", err);
            }
        }
    }, []);

    return <ChatLayout defaultLayout={defaultLayout} users={users} />;
}
