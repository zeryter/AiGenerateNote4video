import { Sparkles } from "lucide-react";
import { ReactPlayer } from "../hooks/useVideoPlayer";
import { getCoverUrl, getVideoUrl } from "@/utils/mediaHelper";

interface VideoPlayerPanelProps {
    task: any;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    reactPlayerRef: React.RefObject<any>;
}

export default function VideoPlayerPanel({ task, videoRef, reactPlayerRef }: VideoPlayerPanelProps) {
    const videoUrl = getVideoUrl(
        task.formData?.video_url || "",
        task.formData?.platform,
        task.audioMeta?.file_path
    );
    const isLocalVideo = task.formData?.platform === "local" || videoUrl.includes("localhost");
    const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");

    const coverUrl = task.audioMeta?.cover_url ? getCoverUrl(task.audioMeta.cover_url) : undefined;

    return (
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-border/50 relative flex-shrink-0">
            {(() => {
                if (videoUrl && isLocalVideo) {
                    return (
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            className="w-full h-full object-contain"
                            controls
                            poster={coverUrl}
                        />
                    );
                } else if (videoUrl && isYouTube) {
                    return (
                        <ReactPlayer
                            ref={reactPlayerRef}
                            url={videoUrl}
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
                                sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
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
