import { motion } from "framer-motion";
import { Settings, ChevronDown, FileText, Plus } from "lucide-react";
import type { IProvider } from "@/types";

type ModelListItem = {
    id: string;
    provider_id: string;
    model_name: string;
    created_at?: string;
};

interface TaskControlsProps {
    providers: IProvider[];
    modelsForProvider: ModelListItem[];
    selectedProviderId: string;
    selectedModelName: string;
    selectedStyle: string;
    onProviderChange: (id: string) => void;
    onModelChange: (name: string) => void;
    onStyleChange: (style: string) => void;
}

const noteStyles = [
    { id: "default", name: "默认风格" },
    { id: "detailed", name: "详细笔记" },
    { id: "concise", name: "精简大纲" },
    { id: "academic", name: "学术风格" },
    { id: "blog", name: "博客文章" },
    { id: "tutorial", name: "教程指南" },
];

export default function TaskControls({
    providers,
    modelsForProvider,
    selectedProviderId,
    selectedModelName,
    selectedStyle,
    onProviderChange,
    onModelChange,
    onStyleChange,
}: TaskControlsProps) {
    return (
        <>
            <motion.div
                className="mt-6 flex items-center gap-3 w-full max-w-xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
            >
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/30 border border-border/50 backdrop-blur-sm">
                    <Settings size={14} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">模型:</span>
                </div>
                {/* Provider Selector */}
                <div className="relative">
                    <select
                        value={selectedProviderId}
                        onChange={(e) => onProviderChange(e.target.value)}
                        className="appearance-none px-4 py-2 pr-8 rounded-xl bg-card/30 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary hover:border-primary/50 transition-colors cursor-pointer"
                    >
                        {providers.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                {/* Model Selector */}
                <div className="relative flex-1">
                    <select
                        value={selectedModelName}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="w-full appearance-none px-4 py-2 pr-8 rounded-xl bg-card/30 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary hover:border-primary/50 transition-colors cursor-pointer"
                    >
                        {modelsForProvider.length > 0 ? (
                            modelsForProvider.map((m) => (
                                <option key={m.model_name} value={m.model_name}>
                                    {m.model_name}
                                </option>
                            ))
                        ) : (
                            <option value="">无可用模型</option>
                        )}
                        <option disabled>──────────</option>
                        <option value="ADD_NEW_MODEL">+ 添加模型</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                <button
                    type="button"
                    onClick={() => onModelChange("ADD_NEW_MODEL")}
                    className="shrink-0 p-2 rounded-xl bg-card/30 hover:bg-card/50 border border-border/50 hover:border-primary/30 backdrop-blur-sm transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="添加模型"
                    title="添加模型"
                >
                    <Plus size={16} />
                </button>
            </motion.div>

            <motion.div
                className="mt-3 flex items-center gap-3 w-full max-w-xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.38 }}
            >
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/30 border border-border/50 backdrop-blur-sm">
                    <FileText size={14} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">风格:</span>
                </div>
                <div className="relative flex-1">
                    <select
                        value={selectedStyle}
                        onChange={(e) => onStyleChange(e.target.value)}
                        className="w-full appearance-none px-4 py-2 pr-8 rounded-xl bg-card/30 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary hover:border-primary/50 transition-colors cursor-pointer"
                    >
                        {noteStyles.map((style) => (
                            <option key={style.id} value={style.id}>
                                {style.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
            </motion.div>
        </>
    );
}
