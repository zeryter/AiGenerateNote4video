import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTaskStore } from "@/store/taskStore";
import { useProviderStore } from "@/store/providerStore";
import { useModelStore } from "@/store/modelStore";
import { generateNote } from "@/services/note";
import { uploadFile } from "@/services/upload";
import { detectPlatform } from "@/utils/platformHelper";
import type { TaskFormData } from "@/store/taskStore";

export function useTaskCreation() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [url, setUrl] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addPendingTask = useTaskStore((s) => s.addPendingTask);
    const setCurrentTask = useTaskStore((s) => s.setCurrentTask);

    const providers = useProviderStore((s) => s.provider);
    const modelList = useModelStore((s) => s.modelList);

    // Selected provider and model state
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [selectedModelName, setSelectedModelName] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string>("default");

    // Derived state
    const enabledProviders = providers.filter((p) => p.enabled);
    const providersWithModels = enabledProviders.filter((p) =>
        modelList.some((m) => m.provider_id === String(p.id))
    );
    const availableProviders = providersWithModels.length > 0 ? providersWithModels : enabledProviders;

    const effectiveSelectedProviderId =
        selectedProviderId && availableProviders.some((p) => String(p.id) === selectedProviderId)
            ? selectedProviderId
            : null;

    const selectedProvider =
        availableProviders.find((p) => String(p.id) === effectiveSelectedProviderId) || availableProviders[0];

    const modelsForProvider = modelList.filter((m) => m.provider_id === String(selectedProvider?.id));

    const effectiveSelectedModelName =
        selectedModelName && modelsForProvider.some((m) => m.model_name === selectedModelName)
            ? selectedModelName
            : null;

    const selectedModel =
        modelsForProvider.find((m) => m.model_name === effectiveSelectedModelName) || modelsForProvider[0];

    type QueueItem =
        | { kind: "url"; url: string }
        | { kind: "file"; file: File };

    const queueRef = useRef<QueueItem[]>([]);
    const isProcessingRef = useRef(false);

    const parseUrls = useCallback((text: string) => {
        return text
            .split(/[\s,]+/g)
            .map((s) => s.trim())
            .filter(Boolean);
    }, []);

    const getDefaultTaskFormData = useCallback(
        (videoUrl: string, platform: string): TaskFormData => {
            return {
                video_url: videoUrl,
                platform,
                quality: "medium",
                model_name: selectedModel?.model_name ?? "",
                provider_id: String(selectedProvider?.id ?? ""),
                format: [],
                style: selectedStyle,
                link: false,
                screenshot: false,
                grid_size: [3, 3],
            };
        },
        [selectedModel?.model_name, selectedProvider?.id, selectedStyle]
    );

    const createTaskFromUrl = useCallback(
        async (singleUrl: string) => {
            const platform = detectPlatform(singleUrl);
            const formData = getDefaultTaskFormData(singleUrl, platform);
            const res = await generateNote(formData);
            const taskId = res?.task_id;
            if (!taskId) return null;
            addPendingTask(taskId, platform, formData);
            setCurrentTask(taskId);
            return taskId;
        },
        [addPendingTask, getDefaultTaskFormData, setCurrentTask]
    );

    const createTaskFromFile = useCallback(
        async (file: File) => {
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);
            const uploadRes = await uploadFile(formDataUpload);
            const fileUrl = uploadRes?.url;
            if (!fileUrl) return null;

            const formData = getDefaultTaskFormData(fileUrl, "local");
            const res = await generateNote(formData);
            const taskId = res?.task_id;
            if (!taskId) return null;
            addPendingTask(taskId, "local", formData);
            setCurrentTask(taskId);
            return taskId;
        },
        [addPendingTask, getDefaultTaskFormData, setCurrentTask]
    );

    const processQueue = useCallback(async () => {
        if (isProcessingRef.current) return;
        if (!selectedProvider || !selectedModel) {
            toast.error("请先在设置中配置模型和提供者");
            navigate("/settings/model");
            queueRef.current = [];
            return;
        }

        isProcessingRef.current = true;
        setIsLoading(true);

        let lastTaskId: string | null = null;
        let succeeded = 0;
        let failed = 0;

        try {
            while (queueRef.current.length > 0) {
                const item = queueRef.current.shift();
                if (!item) continue;

                try {
                    if (item.kind === "url") {
                        const taskId = await createTaskFromUrl(item.url);
                        if (taskId) {
                            lastTaskId = taskId;
                            succeeded += 1;
                        } else {
                            failed += 1;
                        }
                    } else {
                        const taskId = await createTaskFromFile(item.file);
                        if (taskId) {
                            lastTaskId = taskId;
                            succeeded += 1;
                        } else {
                            failed += 1;
                        }
                    }
                } catch (error: unknown) {
                    failed += 1;
                    const message = (error as { message?: string })?.message;
                    toast.error(message || "提交失败");
                }
            }
        } finally {
            isProcessingRef.current = false;
            setIsLoading(false);
        }

        if (succeeded > 0) toast.success(`已提交 ${succeeded} 个任务${failed ? `，失败 ${failed} 个` : ""}`);
        if (lastTaskId) navigate(`/workspace?taskId=${lastTaskId}`, { state: { from: "/" } });
    }, [createTaskFromFile, createTaskFromUrl, navigate, selectedModel, selectedProvider]);

    const enqueue = useCallback(
        (items: QueueItem[]) => {
            if (items.length === 0) return;
            queueRef.current.push(...items);
            void processQueue();
        },
        [processQueue]
    );

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const urls = parseUrls(url);
        if (urls.length === 0) return;
        setUrl("");
        enqueue(urls.map((u) => ({ kind: "url", url: u })));
    };

    const handleFilesUpload = useCallback(
        (files: File[]) => {
            const filtered = files.filter((f) => f.type.startsWith("video/") || f.type.startsWith("audio/"));
            if (filtered.length === 0) {
                toast.error("请选择视频或音频文件");
                return;
            }
            enqueue(filtered.map((file) => ({ kind: "file", file })));
        },
        [enqueue]
    );

    const handleFileUpload = useCallback(
        async (file: File) => {
            handleFilesUpload([file]);
        },
        [handleFilesUpload]
    );

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length > 0) handleFilesUpload(files);
        e.target.value = "";
    };

    return {
        url,
        setUrl,
        isLoading,
        fileInputRef,
        providers: availableProviders,
        modelsForProvider,
        selectedProviderId: effectiveSelectedProviderId || selectedProvider?.id?.toString(),
        selectedModelName: effectiveSelectedModelName || selectedModel?.model_name,
        selectedStyle,
        setSelectedProviderId,
        setSelectedModelName,
        setSelectedStyle,
        handleSubmit,
        handleFileUpload,
        handleFilesUpload,
        handleFileInputChange,
    };
}
