// app/page.tsx (or Home component)
import ChatWrapper from "@/components/ChatWrapper";
import PreferencesTab from "@/components/PreferencesTab";
import { User } from "@/db/types";
import connectDb from "@/lib/db";
import UserModel from "@/models/user";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

async function getUsers(): Promise<User[]> {
    const { getUser } = getKindeServerSession();
    const currentUser = await getUser();
    await connectDb();
    const data: User[] = await UserModel.find({}).lean<User[]>();
    const users = data.filter((user) => user._id != currentUser?.id);
    return users;
}

export default async function Home() {
    const { isAuthenticated } = getKindeServerSession();
    if (!(await isAuthenticated())) return redirect("/auth");

    const users = await getUsers();

    return (
        <main className="flex h-screen flex-col items-center justify-center p-4 md:px-24 py-32 gap-4">
            <PreferencesTab />

            {/* dotted bg */}
            <div
                className="absolute top-0 z-[-2] h-screen w-screen dark:bg-[#000000] dark:bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] 
				dark:bg-[size:20px_20px] bg-[#ffffff] bg-[radial-gradient(#00000033_1px,#ffffff_1px)] bg-[size:20px_20px]"
                aria-hidden="true"
            />

            <div className="z-10 border rounded-lg max-w-5xl w-full min-h-[85vh] text-sm lg:flex">
                <ChatWrapper users={users} />
            </div>
        </main>
    );
}
