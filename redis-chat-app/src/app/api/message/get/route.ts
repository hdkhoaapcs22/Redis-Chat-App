// /app/api/messages/route.ts (Next.js App Router with Edge functions)
import { getMessageAction } from "@/actions/message.action";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { selectedUserId, currentUserId } = await req.json();
    const messages = await getMessageAction(selectedUserId, currentUserId);
    return NextResponse.json(messages);
}
