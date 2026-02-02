import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DescriptionStore {
    descriptions: Record<string, string>; // taskId -> description
    getDescription: (taskId: string) => string;
    setDescription: (taskId: string, description: string) => void;
    removeDescription: (taskId: string) => void;
}

export const useDescriptionStore = create<DescriptionStore>()(
    persist(
        (set, get) => ({
            descriptions: {},

            getDescription: (taskId) => {
                return get().descriptions[taskId] || "";
            },

            setDescription: (taskId, description) => {
                set((state) => ({
                    descriptions: {
                        ...state.descriptions,
                        [taskId]: description,
                    },
                }));
            },

            removeDescription: (taskId) => {
                set((state) => {
                    const { [taskId]: _, ...rest } = state.descriptions;
                    return { descriptions: rest };
                });
            },
        }),
        {
            name: "video-descriptions",
        }
    )
);
