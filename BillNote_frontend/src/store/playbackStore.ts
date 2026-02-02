import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlaybackProgress {
    currentTime: number;      // 当前播放时间（秒）
    duration: number;         // 视频总时长（秒）
    updatedAt: string;        // 最后更新时间
}

interface PlaybackStore {
    progress: Record<string, PlaybackProgress>; // taskId -> progress
    getProgress: (taskId: string) => PlaybackProgress | null;
    setProgress: (taskId: string, currentTime: number, duration: number) => void;
    clearProgress: (taskId: string) => void;
    getProgressPercent: (taskId: string) => number;
    getRecentlyWatched: () => string[]; // 返回最近观看的 taskId 列表
}

export const usePlaybackStore = create<PlaybackStore>()(
    persist(
        (set, get) => ({
            progress: {},

            getProgress: (taskId) => {
                return get().progress[taskId] || null;
            },

            setProgress: (taskId, currentTime, duration) => {
                // 只在有意义的进度时保存（超过3秒且未完成）
                if (currentTime < 3 || duration < 10) return;

                // 如果接近结尾（95%以上），清除进度（视为已看完）
                if (currentTime / duration > 0.95) {
                    set((state) => {
                        const { [taskId]: _, ...rest } = state.progress;
                        return { progress: rest };
                    });
                    return;
                }

                set((state) => ({
                    progress: {
                        ...state.progress,
                        [taskId]: {
                            currentTime,
                            duration,
                            updatedAt: new Date().toISOString(),
                        },
                    },
                }));
            },

            clearProgress: (taskId) => {
                set((state) => {
                    const { [taskId]: _, ...rest } = state.progress;
                    return { progress: rest };
                });
            },

            getProgressPercent: (taskId) => {
                const p = get().progress[taskId];
                if (!p || p.duration === 0) return 0;
                return Math.round((p.currentTime / p.duration) * 100);
            },

            getRecentlyWatched: () => {
                const entries = Object.entries(get().progress);
                // 按更新时间排序，返回最近的
                return entries
                    .sort((a, b) => new Date(b[1].updatedAt).getTime() - new Date(a[1].updatedAt).getTime())
                    .map(([taskId]) => taskId);
            },
        }),
        {
            name: "playback-progress",
        }
    )
);

// 格式化时间显示
export function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}
