import { Avatar, AvatarImage } from "../ui/avatar";
import { Info, Video, X } from "lucide-react";
import { useSelectedUser } from "@/store/useSelectedUser";
import { useSocket } from "@/context/SocketContext";

const ChatTopBarComponent = () => {
    const { selectedUser, setSelectedUser } = useSelectedUser();
    const { onlineUsers, handleCall } = useSocket();
    return (
        <div className="w-full h-20 flex p-4 justify-between items-center border-b">
            <div className="flex items-center gap-2">
                <Avatar className="flex justify-center items-center">
                    <AvatarImage
                        src={selectedUser?.image || "/user-placeholder.png"}
                        alt="User Image"
                        className="w-10 h-10 object-cover rounded-full"
                    />
                </Avatar>
                <span className="font-medium">{selectedUser?.name}</span>
            </div>

            <div className="flex gap-2">
                <Video
                    className="text-muted-foreground cursor-pointer hover:text-primary"
                    onClick={() => {
                        const calledUser = onlineUsers?.filter(
                            (onlineUser) =>
                                onlineUser.userId === selectedUser?._id
                        );
                        handleCall(calledUser![0]);
                    }}
                />
                <Info className="text-muted-foreground cursor-pointer hover:text-primary" />
                <X
                    className="text-muted-foreground cursor-pointer hover:text-primary"
                    onClick={() => {
                        console.log("FFFFFFFFFFFFFFFFFF");
                        setSelectedUser(null);
                    }}
                />
            </div>
        </div>
    );
};
export default ChatTopBarComponent;
