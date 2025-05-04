"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import UserModel from "@/models/user";

export async function checkAuthStatus() {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) return { success: false };

    const existingUser = await UserModel.findOne({ _id: user.id });

    if (!existingUser || Object.keys(existingUser).length === 0) {
        const imgIsNull = user.picture?.includes("gravatar");
        const image = imgIsNull ? "" : user.picture;

        const newUser = new UserModel({
            _id: user.id,
            email: user.email,
            name: `${user.given_name} ${user.family_name}`,
            image: image,
        });

        await newUser.save();
    }

    return { success: true };
}
