import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTaskStore } from "@/store/taskStore";
import { useProviderStore } from "@/store/providerStore";
import { useModelStore } from "@/store/modelStore";
import { generateNote } from "@/services/note";
import { uploadFile } from "@/services/upload";
import { detectPlatform } from "@/utils/platformHelper";

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

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!url.trim()) return;

        if (!selectedProvider || !selectedModel) {
            toast.error("请先在设置中配置模型和提供者");
            navigate("/settings/model");
            return;
        }

        setIsLoading(true);
        try {
            const platform = detectPlatform(url);
            const formData = {
                video_url: url,
                platform,
                quality: "medium",
                model_name: selectedModel.model_name,
                provider_id: String(selectedProvider.id),
                format: [],
                style: selectedStyle,
                link: false,
                screenshot: false,
                grid_size: [],
            };

            const res = await generateNote(formData);
            if (res?.task_id) {
                addPendingTask(res.task_id, platform, formData);
                setCurrentTask(res.task_id);
                navigate(`/workspace?taskId=${res.task_id}`, { state: { from: '/' } });
            }
        } catch (err: any) {
            toast.error(err?.message || "提交失败");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = useCallback(async (file: File) => {
        if (!selectedProvider || !selectedModel) {
            toast.error("请先在设置中配置模型和提供者");
            navigate("/settings/model");
            return;
        }

        setIsLoading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);
            const uploadRes = await uploadFile(formDataUpload);
            const fileUrl = uploadRes?.url;

            if (!fileUrl) {
                toast.error("文件上传失败");
                return;
            }

            const formData = {
                video_url: fileUrl,
                platform: "local",
                quality: "medium",
                model_name: selectedModel.model_name,
                provider_id: String(selectedProvider.id),
                format: [],
                style: selectedStyle,
                link: false,
                screenshot: false,
                grid_size: [],
            };

            const res = await generateNote(formData);
            if (res?.task_id) {
                addPendingTask(res.task_id, "local", formData);
                setCurrentTask(res.task_id);
                navigate(`/workspace?taskId=${res.task_id}`, { state: { from: '/' } });
            }
        } catch (err: any) {
            toast.error(err?.message || "上传失败");
        } finally {
            setIsLoading(false);
        }
    }, [selectedProvider, selectedModel, selectedStyle, navigate, addPendingTask, setCurrentTask]);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
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
        handleFileInputChange,
    };
}
