import { User } from "@/db/dummy";
import { create } from "zustand";

type SelectedUserProps = {
    selectedUser: User | null;
    setSelectedUser: (user: User | null) => void;
};

export const useSelectedUser = create<SelectedUserProps>((set) => ({
    selectedUser: null,
    setSelectedUser: (user: User | null) => set({ selectedUser: user }),
}));
