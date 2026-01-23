import { useRef } from "react";
import ReactPlayerBase from "react-player";

// Fix for ReactPlayer import in Vite
const maybeReactPlayer = ReactPlayerBase as unknown as { default?: typeof ReactPlayerBase };
export const ReactPlayer = maybeReactPlayer.default ?? ReactPlayerBase;

export function useVideoPlayer() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const reactPlayerRef = useRef<HTMLVideoElement>(null);

    const handleSeek = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            videoRef.current.play();
        } else if (reactPlayerRef.current) {
            reactPlayerRef.current.currentTime = time;
            reactPlayerRef.current.play();
        }
    };

    const getCurrentTime = (): number => {
        if (videoRef.current) {
            return videoRef.current.currentTime;
        } else if (reactPlayerRef.current) {
            return reactPlayerRef.current.currentTime;
        }
        return 0;
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
        // ReactPlayer toggle logic would go here if needed
    };

    const seekRelative = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        } else if (reactPlayerRef.current) {
            reactPlayerRef.current.currentTime += seconds;
        }
    }

    return {
        videoRef,
        reactPlayerRef,
        handleSeek,
        getCurrentTime,
        togglePlay,
        seekRelative
    };
}
