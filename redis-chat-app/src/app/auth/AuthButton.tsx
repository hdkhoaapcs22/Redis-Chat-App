"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const AuthButtons = () => {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="flex gap-3 flex-1 md:flex-row flex-col relative z-50">
            <Button className="w-full" variant={"outline"} disabled={isLoading}>
                Sign up
            </Button>
            <Button className="w-full" disabled={isLoading}>
                Login
            </Button>
        </div>
    );
};
export default AuthButtons;
