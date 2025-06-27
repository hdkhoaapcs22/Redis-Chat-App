"use client";
import { MoonIcon, SunIcon, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { usePreferences } from "@/store/usePreferences";
import { useSound } from "use-sound";
import React from "react";

const PreferencesTabComponent = () => {
    console.log("PreferencesTab");
    const { setTheme } = useTheme();

    const { soundEnabled, setSoundEnabled } = usePreferences();
    const [playMouseClick] = useSound("/sounds/mouse-click.mp3");
    const [playSoundOn] = useSound("/sounds/sound-on.mp3", { volume: 0.3 });
    const [playSoundOff] = useSound("/sounds/sound-off.mp3", { volume: 0.3 });

    return (
        <div className="flex flex-wrap gap-2 px-1 md:px-2">
            <Button
                variant={"outline"}
                size={"icon"}
                onClick={() => {
                    setTheme("light");
                    if (soundEnabled) playMouseClick();
                }}
            >
                <SunIcon className="size-[1.2rem] text-muted-foreground" />
            </Button>
            <Button
                variant={"outline"}
                size={"icon"}
                onClick={() => {
                    setTheme("dark");
                    if (soundEnabled) playMouseClick();
                }}
            >
                <MoonIcon className="size-[1.2rem] text-muted-foreground" />
            </Button>
            <Button
                variant={"outline"}
                size={"icon"}
                onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    if (soundEnabled) {
                        playSoundOff();
                    } else {
                        playSoundOn();
                    }
                }}
            >
                {soundEnabled ? (
                    <Volume2 className="size-[1.2rem] text-muted-foreground" />
                ) : (
                    <VolumeX className="size-[1.2rem] text-muted-foreground" />
                )}
            </Button>
        </div>
    );
};

// ✅ Fix: assign display name
const PreferencesTab = React.memo(PreferencesTabComponent);
PreferencesTab.displayName = "PreferencesTab";

export default PreferencesTab;
