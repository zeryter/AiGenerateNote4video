import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useSearchParams, Link } from "react-router-dom";
import { Sparkles, Home } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTaskStore, Markdown } from "@/store/taskStore";
import { useProviderStore } from "@/store/providerStore";
import { useModelStore } from "@/store/modelStore";
import toast from "react-hot-toast";

import { useVideoPlayer } from "./hooks/useVideoPlayer";
import WorkspaceHeader from "./components/WorkspaceHeader";
import VideoPlayerPanel from "./components/VideoPlayerPanel";
import AiNotePanel from "./components/AiNotePanel";
import UserNotePanel from "./components/UserNotePanel";

import { statusMap } from "@/constant/status";

export default function WorkspacePage() {
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
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Sparkles size={48} className="text-primary/50" />
                <p>没有选中的任务</p>
                <Link to="/" className="text-primary hover:underline flex items-center gap-2">
                    <Home size={16} /> 返回首页
                </Link>
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
                                task={task}
                                videoRef={videoRef}
                                reactPlayerRef={reactPlayerRef}
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
                        />
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}
