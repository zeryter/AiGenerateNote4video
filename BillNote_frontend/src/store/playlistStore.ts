import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task } from "@/store/taskStore";

export interface PlaylistItem {
    taskId: string;
    title: string;
    coverUrl?: string;
    platform?: string;
    createdAt: string;
}

interface PlaylistStore {
    items: PlaylistItem[];
    addTask: (task: Task) => void;
    addTasks: (tasks: Task[]) => void;
    replaceWithTasks: (tasks: Task[]) => void;
    removeTask: (taskId: string) => void;
    clear: () => void;
    sortByName: (order: "asc" | "desc") => void;
    sortByCreatedAt: (order: "asc" | "desc") => void;
}

export const usePlaylistStore = create<PlaylistStore>()(
    persist(
        (set, get) => ({
            items: [],
            addTask: (task) => {
                const exists = get().items.some((item) => item.taskId === task.id);
                if (exists) return;
                const nextItem: PlaylistItem = {
                    taskId: task.id,
                    title: task.audioMeta?.title || task.formData?.video_url || task.id,
                    coverUrl: task.audioMeta?.cover_url || "",
                    platform: task.platform,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    items: [nextItem, ...state.items],
                }));
            },
            addTasks: (tasks) => {
                const existing = new Set(get().items.map((item) => item.taskId));
                const incoming = tasks
                    .filter((task) => !existing.has(task.id))
                    .map((task) => ({
                        taskId: task.id,
                        title: task.audioMeta?.title || task.formData?.video_url || task.id,
                        coverUrl: task.audioMeta?.cover_url || "",
                        platform: task.platform,
                        createdAt: new Date().toISOString(),
                    }));
                if (incoming.length === 0) return;
                set((state) => ({
                    items: [...incoming, ...state.items],
                }));
            },
            replaceWithTasks: (tasks) => {
                const nextItems: PlaylistItem[] = tasks.map((task) => ({
                    taskId: task.id,
                    title: task.audioMeta?.title || task.formData?.video_url || task.id,
                    coverUrl: task.audioMeta?.cover_url || "",
                    platform: task.platform,
                    createdAt: new Date().toISOString(),
                }));
                set({ items: nextItems });
            },
            removeTask: (taskId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.taskId !== taskId),
                }));
            },
            clear: () => set({ items: [] }),
            sortByName: (order) => {
                set((state) => ({
                    items: [...state.items].sort((a, b) => {
                        const ta = a.title.toLowerCase();
                        const tb = b.title.toLowerCase();
                        return order === "asc" ? ta.localeCompare(tb) : tb.localeCompare(ta);
                    }),
                }));
            },
            sortByCreatedAt: (order) => {
                set((state) => ({
                    items: [...state.items].sort((a, b) => {
                        const ta = new Date(a.createdAt).getTime();
                        const tb = new Date(b.createdAt).getTime();
                        return order === "asc" ? ta - tb : tb - ta;
                    }),
                }));
            },
        }),
        {
            name: "playlist-store",
        }
    )
);
