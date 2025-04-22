// app/page.tsx (or Home component)
import ChatWrapper from "@/components/ChatWrapper";
import PreferencesTab from "@/components/PreferencesTab";
import { User } from "@/db/dummy";
import { redis } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

async function getUser(): Promise<User[]> {
    let cursor: string = "0";
    const userKeys: string[] = [];
    do {
        const [nextCursor, keys] = await redis.scan(cursor, {
            match: "user:*",
            count: 100,
            type: "hash",
        });
        cursor = nextCursor;
        userKeys.push(...keys);
    } while (cursor !== "0");

    const users: User[] = [];

    const { getUser } = getKindeServerSession();
    const currentUser = await getUser();

    const pipeline = redis.pipeline();
    userKeys.forEach((key) => {
        pipeline.hgetall(key);
    });
    const results = (await pipeline.exec()) as User[];

    for (const user of results) {
        if (user.id !== currentUser?.id) {
            users.push(user);
        }
    }
    return users;
}

export default async function Home() {
    const { isAuthenticated } = getKindeServerSession();
    if (!(await isAuthenticated())) return redirect("/auth");

    const user = await getUser();

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
                <ChatWrapper user={user} />
            </div>
        </main>
    );
}
