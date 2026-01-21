import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { History, Film } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useTaskStore } from "@/store/taskStore";
import { useProviderStore } from "@/store/providerStore";
import { useModelStore } from "@/store/modelStore";

import { useTaskCreation } from "./hooks/useTaskCreation";
import HeroSection from "./components/HeroSection";
import UrlInput from "./components/UrlInput";
import TaskControls from "./components/TaskControls";
import DropZone from "./components/DropZone";

export default function HomePage() {
    const navigate = useNavigate();
    const [isDragging, setIsDragging] = useState(false);

    const {
        url,
        setUrl,
        isLoading,
        fileInputRef,
        providers,
        modelsForProvider,
        selectedProviderId,
        selectedModelName,
        selectedStyle,
        setSelectedProviderId,
        setSelectedModelName,
        setSelectedStyle,
        handleSubmit,
        handleFileUpload,
        handleFileInputChange,
    } = useTaskCreation();

    const fetchProviders = useProviderStore((s) => s.fetchProviderList);
    const loadEnabledModels = useModelStore((s) => s.loadEnabledModels);

    const tasks = useTaskStore((s) => s.tasks);
    const setCurrentTask = useTaskStore((s) => s.setCurrentTask);

    useEffect(() => {
        fetchProviders();
        loadEnabledModels();
    }, [fetchProviders, loadEnabledModels]);


    // Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.type.startsWith("video/") || file.type.startsWith("audio/"))) {
            handleFileUpload(file);
        } else {
            toast.error("请拖入视频或音频文件");
        }
    };

    return (
        <div
            className="flex flex-col items-center justify-center h-full w-full px-4 text-center relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Top Navigation */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                <button
                    onClick={() => navigate("/history")}
                    className="p-2 rounded-full bg-card/30 hover:bg-card/50 border border-border/50 backdrop-blur-sm transition-colors text-muted-foreground hover:text-foreground"
                    title="历史记录"
                >
                    <History size={20} />
                </button>
            </div>

            <DropZone isDragging={isDragging} />

            <div className="flex flex-col items-center max-w-2xl w-full">
                <HeroSection />

                <UrlInput
                    url={url}
                    onUrlChange={setUrl}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />

                <TaskControls
                    providers={providers}
                    modelsForProvider={modelsForProvider}
                    selectedProviderId={selectedProviderId}
                    selectedModelName={selectedModelName}
                    selectedStyle={selectedStyle}
                    onProviderChange={(id) => {
                        setSelectedProviderId(id);
                        setSelectedModelName(null);
                    }}
                    onModelChange={(value) => {
                        if (value === "ADD_NEW_MODEL") {
                            navigate("/settings/model");
                            return;
                        }
                        setSelectedModelName(value);
                    }}
                    onStyleChange={setSelectedStyle}
                />

                {/* Separator + Upload Button */}
                <motion.div
                    className="mt-6 flex items-center gap-4 w-full max-w-xl"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-xs text-muted-foreground uppercase">或</span>
                    <div className="flex-1 h-px bg-border/50" />
                </motion.div>

                <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="mt-6 flex items-center gap-3 px-6 py-3 rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 hover:border-primary/30 transition-all text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Film size={18} />
                    <span>上传本地视频/音频</span>
                </motion.button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,audio/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                />

                {/* Recent Tasks */}
                {tasks.length > 0 && (
                    <motion.div
                        className="mt-12 flex flex-wrap justify-center gap-3"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="w-full flex items-center justify-center gap-4 mb-2">
                            <span className="text-xs text-muted-foreground">最近任务</span>
                            <Link to="/history" className="text-xs text-primary hover:underline">查看全部</Link>
                        </div>
                        {tasks.slice(0, 3).map((task) => (
                            <button
                                key={task.id}
                                onClick={() => {
                                    setCurrentTask(task.id);
                                    navigate(`/workspace?taskId=${task.id}`, { state: { from: '/' } });
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/30 hover:bg-card/50 hover:border-primary/30 transition-all text-sm text-muted-foreground hover:text-foreground truncate max-w-[200px]"
                            >
                                <Film size={14} />
                                <span className="truncate">{task.audioMeta?.title || task.formData?.video_url?.substring(0, 20) || task.id.substring(0, 8)}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
