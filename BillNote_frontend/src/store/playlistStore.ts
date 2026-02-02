import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task } from "@/store/taskStore";

export interface PlaylistItem {
    taskId: string;
    title: string;
    coverUrl?: string;
    platform?: string;
    createdAt: string;
    duration?: number; // in seconds
    isDeleted?: boolean;
}

export interface SavedPlaylist {
    id: string;
    name: string;
    items: PlaylistItem[];
    createdAt: string;
    lastActiveTaskId?: string;
}

interface PlaylistStore {
    items: PlaylistItem[];
    savedPlaylists: SavedPlaylist[];
    addTask: (task: Task) => void;
    addTasks: (tasks: Task[]) => void;
    replaceWithTasks: (tasks: Task[]) => void;
    removeTask: (taskId: string) => void;
    clear: () => void;
    sortByName: (order: "asc" | "desc") => void;
    sortByCreatedAt: (order: "asc" | "desc") => void;
    savePlaylist: (name: string, activeTaskId?: string) => void;
    removePlaylist: (id: string) => void;
    loadPlaylist: (id: string) => string | undefined;
    renamePlaylist: (id: string, newName: string) => void;
}

export const usePlaylistStore = create<PlaylistStore>()(
    persist(
        (set, get) => ({
            items: [],
            savedPlaylists: [],

            savePlaylist: (name, activeTaskId) => {
                const currentItems = get().items;
                if (currentItems.length === 0) return;

                const newPlaylist: SavedPlaylist = {
                    id: crypto.randomUUID(),
                    name,
                    items: [...currentItems], // Store full snapshot
                    createdAt: new Date().toISOString(),
                    lastActiveTaskId: activeTaskId,
                };

                set((state) => ({
                    savedPlaylists: [newPlaylist, ...state.savedPlaylists],
                }));
            },

            removePlaylist: (id) => {
                set((state) => ({
                    savedPlaylists: state.savedPlaylists.filter(p => p.id !== id),
                }));
            },

            loadPlaylist: (id) => {
                const playlist = get().savedPlaylists.find(p => p.id === id);
                if (!playlist) return undefined;

                // Restore items directly from snapshot
                // Handle legacy structure where items might be missing (if user has old data)
                // providing backward compatibility
                let loadedItems: PlaylistItem[] = [];

                if (playlist.items) {
                    loadedItems = playlist.items;
                } else if ((playlist as any).taskIds) {
                    // Legacy support: Try to recover what we can, but we don't have allTasks here anymore.
                    // This is a tradeoff. Old playlists might appear empty or broken until recreated.
                    // We generate placeholder items.
                    loadedItems = ((playlist as any).taskIds as string[]).map(tid => ({
                        taskId: tid,
                        title: "未知任务 (旧数据)",
                        createdAt: new Date().toISOString(),
                        platform: "unknown"
                    }));
                }

                set({ items: loadedItems });
                return playlist.lastActiveTaskId;
            },

            renamePlaylist: (id, newName) => {
                set((state) => ({
                    savedPlaylists: state.savedPlaylists.map(p =>
                        p.id === id ? { ...p, name: newName } : p
                    ),
                }));
            },

            addTask: (task) => {
                const exists = get().items.some((item) => item.taskId === task.id);
                if (exists) return;
                const nextItem: PlaylistItem = {
                    taskId: task.id,
                    title: task.audioMeta?.title || task.formData?.video_url || task.id,
                    coverUrl: task.audioMeta?.cover_url || "",
                    platform: task.platform,
                    createdAt: new Date().toISOString(),
                    duration: task.audioMeta?.duration || 0,
                    isDeleted: false,
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
                        duration: task.audioMeta?.duration || 0,
                        isDeleted: false,
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
                    duration: task.audioMeta?.duration || 0,
                    isDeleted: false,
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
                        // Use natural sort (numeric collation) to handle numbers correctly
                        // e.g., "直播1" < "直播2" < "直播10" instead of "直播1" < "直播10" < "直播2"
                        const comparison = ta.localeCompare(tb, undefined, { numeric: true, sensitivity: 'base' });
                        return order === "asc" ? comparison : -comparison;
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
