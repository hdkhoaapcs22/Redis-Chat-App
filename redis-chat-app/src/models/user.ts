import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        _id: String,
        email: String,
        name: String,
        image: String,
    },
    {
        timestamps: true,
    }
);

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

export default UserModel;
