import { Sparkles, Subtitles } from "lucide-react";
import { ReactPlayer } from "../hooks/useVideoPlayer";
import { getCoverUrl, getVideoUrl } from "@/utils/mediaHelper";
import { useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";
import toast from "react-hot-toast";
import type { Task } from "@/store/taskStore";

interface VideoPlayerPanelProps {
    task: Task;
    videoRef: RefObject<HTMLVideoElement | null>;
    reactPlayerRef: RefObject<HTMLVideoElement | null>;
}

export default function VideoPlayerPanel({ task, videoRef, reactPlayerRef }: VideoPlayerPanelProps) {
    const videoUrl = getVideoUrl(
        task.formData?.video_url || "",
        task.formData?.platform,
        task.audioMeta?.file_path
    );
    const isLocalVideo = task.formData?.platform === "local" || videoUrl.includes("localhost");
    const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
    const segments = useMemo(() => task.transcript?.segments ?? [], [task.transcript?.segments]);
    const [showSubtitles, setShowSubtitles] = useState(false);

    const vttContent = useMemo(() => {
        if (!isLocalVideo || segments.length === 0) return "";
        const formatTime = (seconds: number) => {
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);
            const pad = (n: number, len = 2) => String(n).padStart(len, "0");
            return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
        };

        const lines = [
            "WEBVTT",
            "",
            ...segments.flatMap((seg, index) => {
                const start = formatTime(seg.start);
                const end = formatTime(seg.end);
                const text = seg.text?.trim() || "";
                if (!text) return [];
                return [
                    String(index + 1),
                    `${start} --> ${end}`,
                    text,
                    "",
                ];
            }),
        ];

        return lines.join("\n");
    }, [isLocalVideo, segments]);

    const subtitleUrl = useMemo(() => {
        if (!showSubtitles || !vttContent) return "";
        const blob = new Blob([vttContent], { type: "text/vtt" });
        return URL.createObjectURL(blob);
    }, [showSubtitles, vttContent]);

    useEffect(() => {
        return () => {
            if (subtitleUrl) URL.revokeObjectURL(subtitleUrl);
        };
    }, [subtitleUrl]);

    const coverUrl = task.audioMeta?.cover_url ? getCoverUrl(task.audioMeta.cover_url) : undefined;

    return (
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-border/50 relative flex-shrink-0">
            {segments.length > 0 && (
                <button
                    type="button"
                    onClick={() => {
                        if (!isLocalVideo) {
                            toast.error("字幕仅支持本地视频，URL 视频请手动操作");
                            return;
                        }
                        setShowSubtitles((prev) => !prev);
                    }}
                    className={`absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium transition-colors ${showSubtitles ? "bg-primary text-primary-foreground" : "bg-background/70 text-muted-foreground hover:bg-background"}`}
                    title={showSubtitles ? "关闭字幕" : "开启字幕"}
                >
                    <Subtitles size={14} />
                    字幕
                </button>
            )}
            {(() => {
                if (videoUrl && isLocalVideo) {
                    return (
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            className="w-full h-full object-contain"
                            controls
                            poster={coverUrl}
                        >
                            {showSubtitles && subtitleUrl && (
                                <track kind="subtitles" src={subtitleUrl} srcLang="zh" label="中文" default />
                            )}
                        </video>
                    );
                } else if (videoUrl && isYouTube) {
                    return (
                        <ReactPlayer
                            ref={reactPlayerRef}
                            src={videoUrl}
                            width="100%"
                            height="100%"
                            controls
                            playing={false}
                        />
                    );
                } else if (videoUrl && (videoUrl.includes("bilibili.com") || videoUrl.includes("b23.tv"))) {
                    // Extract BVID
                    const match = videoUrl.match(/(BV[a-zA-Z0-9]+)/);
                    const bvid = match ? match[1] : "";

                    if (bvid) {
                        return (
                            <iframe
                                title="Bilibili Player"
                                src={`https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0`}
                                scrolling="no"
                                frameBorder="0"
                                allowFullScreen
                                className="w-full h-full"
                                sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups allow-popups-to-escape-sandbox"
                            />
                        );
                    }
                    // If no BVID found (e.g. b23.tv short link without redirect resolution), fall back to cover
                } else if (coverUrl) {
                    return (
                        <img
                            src={coverUrl}
                            alt="Video Cover"
                            className="w-full h-full object-cover"
                        />
                    );
                } else {
                    return (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            <Sparkles size={32} className="animate-pulse" />
                        </div>
                    );
                }
            })()}
        </div>
    );
}
