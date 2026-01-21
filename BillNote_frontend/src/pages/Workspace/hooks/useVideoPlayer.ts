import { useRef } from "react";
import ReactPlayerBase from "react-player";

// Fix for ReactPlayer import in Vite
export const ReactPlayer = (ReactPlayerBase as any).default || ReactPlayerBase;

export function useVideoPlayer() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const reactPlayerRef = useRef<any>(null);

    const handleSeek = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            videoRef.current.play();
        } else if (reactPlayerRef.current) {
            reactPlayerRef.current.seekTo(time);
            // reactPlayerRef.current.getInternalPlayer().play(); 
        }
    };

    const getCurrentTime = (): number => {
        if (videoRef.current) {
            return videoRef.current.currentTime;
        } else if (reactPlayerRef.current) {
            return reactPlayerRef.current.getCurrentTime();
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
            reactPlayerRef.current.seekTo(reactPlayerRef.current.getCurrentTime() + seconds);
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
