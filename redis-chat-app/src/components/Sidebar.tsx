import { User } from "@/db/types";
import { ScrollArea } from "./ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import useSound from "use-sound";
import { usePreferences } from "@/store/usePreferences";
import { LogOut } from "lucide-react";
import { useSelectedUser } from "@/store/useSelectedUser";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useSocket } from "@/context/SocketContext";
import React from "react";

type SidebarProps = {
    isCollapsed: boolean;
    users: User[];
};

const SidebarComponent = ({ isCollapsed, users }: SidebarProps) => {
    const [playClickSound] = useSound("/sounds/mouse-click.mp3");
    const { soundEnabled } = usePreferences();

    const { selectedUser, setSelectedUser } = useSelectedUser();
    const { user } = useKindeBrowserClient();
    const { onlineUsers } = useSocket();

    console.log("Sidebar is created");

    return (
        <div className="group relative flex flex-col h-full gap-4 p-2 data-[collapsed=true]:p-2 max-h-full overflow-auto bg-background">
            {!isCollapsed && (
                <div className="flex justify-between p-2 items-center">
                    <div className="flex gap-2 items-center text-2xl">
                        <p className="font-medium">Chats</p>
                    </div>
                </div>
            )}

            <ScrollArea className="gap-2 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                {users.map((user, idx) =>
                    isCollapsed ? (
                        <TooltipProvider key={idx}>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <div
                                        onClick={() => {
                                            if (soundEnabled) playClickSound();
                                            setSelectedUser(user);
                                        }}
                                        className="relative"
                                    >
                                        <Avatar className="my-1 flex justify-center items-center">
                                            <AvatarImage
                                                src={user.image || "/user-placeholder.png"}
                                                alt="User Image"
                                                className="border-2 border-white rounded-full w-10 h-10"
                                            />
                                            <AvatarFallback>
                                                {user.name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="sr-only">
                                            {user.name}
                                        </span>
                                        {onlineUsers?.some(
                                            (onlineUser) => user._id === onlineUser.userId
                                        ) && (
                                            <div className="absolute w-2.5 h-2.5 bg-green-500 rounded-4xl" />
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="flex items-center gap-4">
                                    {user.name}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <Button
                            key={idx}
                            variant={"grey"}
                            size="xl"
                            className={cn(
                                "relative w-full justify-start gap-4 my-1",
                                selectedUser?.email === user.email &&
                                    "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink"
                            )}
                            onClick={() => {
                                if (soundEnabled) playClickSound();
                                setSelectedUser(user);
                            }}
                        >
                            <Avatar className="flex justify-center items-center">
                                <AvatarImage
                                    src={user.image || "/user-placeholder.png"}
                                    alt={"User image"}
                                    className="w-10 h-10"
                                />
                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col max-w-28">
                                <span>{user.name}</span>
                            </div>
                            {onlineUsers?.some(
                                (onlineUser) => user._id === onlineUser.userId
                            ) && (
                                <div className="absolute w-3.5 h-3.5 bg-blue-500 rounded-4xl left-0 top-0 animate-pulse" />
                            )}
                        </Button>
                    )
                )}
            </ScrollArea>

            {/* Logout section */}
            <div className="mt-auto">
                <div className="flex justify-between items-center gap-2 md:px-6 py-2">
                    {!isCollapsed && (
                        <div className="hidden md:flex gap-2 items-center">
                            <Avatar className="flex justify-center items-center">
                                <AvatarImage
                                    src={user?.picture || "/user-placeholder.png"}
                                    alt="avatar"
                                    referrerPolicy="no-referrer"
                                    className="w-8 h-8 border-2 border-white rounded-full"
                                />
                            </Avatar>
                            <p className="font-bold">
                                {user?.given_name} {user?.family_name}
                            </p>
                        </div>
                    )}
                    <div className="flex">
                        <LogoutLink>
                            <LogOut size={26} cursor={"pointer"} />
                        </LogoutLink>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Sidebar = React.memo(SidebarComponent);
Sidebar.displayName = "Sidebar";

export default Sidebar;

