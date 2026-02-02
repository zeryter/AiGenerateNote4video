import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Sparkles, Home } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTaskStore, Markdown } from "@/store/taskStore";
import { useProviderStore } from "@/store/providerStore";
import { useModelStore } from "@/store/modelStore";
import toast from "react-hot-toast";
import { EmptyState } from "@/components/ui/empty-state";

import { useVideoPlayer } from "./hooks/useVideoPlayer";
import WorkspaceHeader from "./components/WorkspaceHeader";
import VideoPlayerPanel from "./components/VideoPlayerPanel";
import AiNotePanel from "./components/AiNotePanel";
import UserNotePanel from "./components/UserNotePanel";
import { getVideoUrl } from "@/utils/mediaHelper";
import PlaylistPanel from "./components/PlaylistPanel";

import { statusMap } from "@/constant/status";

export default function WorkspacePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const taskId = searchParams.get("taskId");

    const tasks = useTaskStore((s) => s.tasks);
    const currentTaskId = useTaskStore((s) => s.currentTaskId);
    const setCurrentTask = useTaskStore((s) => s.setCurrentTask);
    const retryTask = useTaskStore((s) => s.retryTask);
    const fetchTasks = useTaskStore((s) => s.fetchTasks);

    // Video Player Logic Hook
    const { videoRef, reactPlayerRef, handleSeek, getCurrentTime, togglePlay, seekRelative } = useVideoPlayer();

    // Find the current task
    const task = useMemo(() => {
        const id = taskId || currentTaskId;
        return tasks.find((t) => t.id === id) || null;
    }, [taskId, currentTaskId, tasks]);
    const videoUrl = useMemo(() => {
        if (!task) return "";
        return getVideoUrl(
            task.formData?.video_url || "",
            task.formData?.platform,
            task.audioMeta?.file_path
        );
    }, [task]);
    const isLocalVideo = useMemo(() => {
        if (!task) return false;
        return task.formData?.platform === "local" || videoUrl.includes("localhost");
    }, [task, videoUrl]);

    const [myNote, setMyNote] = useState("");
    const [copied, setCopied] = useState(false);

    // Provider/Model stores fetching
    const providers = useProviderStore((s) => s.provider);
    const fetchProviders = useProviderStore((s) => s.fetchProviderList);
    const modelList = useModelStore((s) => s.modelList);
    const loadEnabledModels = useModelStore((s) => s.loadEnabledModels);

    useEffect(() => {
        if (providers.length === 0) fetchProviders();
        if (modelList.length === 0) loadEnabledModels();
    }, [providers.length, fetchProviders, modelList.length, loadEnabledModels]);

    useEffect(() => {
        if (taskId) {
            fetchTasks();
        }
    }, [taskId, fetchTasks]);

    // Set current task on mount
    useEffect(() => {
        if (taskId && taskId !== currentTaskId) {
            setCurrentTask(taskId);
        }
    }, [taskId, currentTaskId, setCurrentTask]);

    // Load user note from localStorage
    useEffect(() => {
        if (task?.id) {
            const savedNote = localStorage.getItem(`my_note_${task.id}`);
            if (savedNote) {
                setMyNote(savedNote);
            } else {
                setMyNote("");
            }
        }
    }, [task?.id]);

    // Save user note
    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setMyNote(newValue);
        if (task?.id) {
            localStorage.setItem(`my_note_${task.id}`, newValue);
        }
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.shiftKey) return;
            if (e.code === "Space") {
                e.preventDefault();
                togglePlay();
            }
            if (e.code === "ArrowLeft") {
                e.preventDefault();
                seekRelative(-5);
            }
            if (e.code === "ArrowRight") {
                e.preventDefault();
                seekRelative(5);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [togglePlay, seekRelative]);

    if (!task) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <EmptyState
                    icon={<Sparkles size={48} className="text-primary/50" />}
                    title="没有选中的任务"
                    description="从历史记录或首页选择一个任务"
                    action={
                        <Link to="/" className="text-primary hover:underline inline-flex items-center gap-2">
                            <Home size={16} /> 返回首页
                        </Link>
                    }
                />
            </div>
        );
    }

    const isLoading = task.status !== "SUCCESS" && task.status !== "FAILED";
    const statusInfo = statusMap[task.status] || statusMap.PENDING;

    const markdownContent = (() => {
        if (!task.markdown) return "";
        if (typeof task.markdown === "string") return task.markdown;
        if (Array.isArray(task.markdown) && task.markdown.length > 0) {
            return (task.markdown as Markdown[])[0]?.content || "";
        }
        return "";
    })();

    const handleCopy = async () => {
        if (markdownContent) {
            await navigator.clipboard.writeText(markdownContent);
            setCopied(true);
            toast.success("已复制到剪贴板");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRetry = (providerId: string, modelName: string) => {
        if (task.id) {
            retryTask(task.id, {
                provider_id: providerId,
                model_name: modelName
            });
            toast.success("重试任务已提交");
        }
    };
    const handleSelectTask = (id: string) => {
        setCurrentTask(id);
        navigate(`/workspace?taskId=${id}`, { state: { from: "/workspace" } });
    };

    return (
        <div className="h-full w-full flex flex-col">
            <WorkspaceHeader
                task={task}
                statusInfo={statusInfo}
                onRetry={handleRetry}
                onCopy={handleCopy}
                copied={copied}
            />

            <div className="flex-1 overflow-hidden relative">
                <PanelGroup direction="horizontal" className="h-full w-full">
                    {/* Left Panel */}
                    <Panel defaultSize={50} minSize={30}>
                        <div className="h-full w-full p-4 flex flex-col gap-4">
                            <VideoPlayerPanel
                                key={task.id}
                                task={task}
                                videoRef={videoRef}
                                reactPlayerRef={reactPlayerRef}
                            />
                            <PlaylistPanel
                                currentTask={task}
                                onSelectTask={handleSelectTask}
                            />
                            <AiNotePanel
                                isLoading={isLoading}
                                markdownContent={markdownContent}
                                transcriptSegments={task.transcript?.segments || []}
                            />
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />

                    {/* Right Panel */}
                    <Panel defaultSize={50} minSize={30}>
                        <UserNotePanel
                            myNote={myNote}
                            onNoteChange={handleNoteChange}
                            getCurrentTime={getCurrentTime}
                            onSeek={handleSeek}
                            isLocalVideo={isLocalVideo}
                        />
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}
