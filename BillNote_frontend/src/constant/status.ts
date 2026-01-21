export const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: "排队中", color: "text-yellow-500" },
    PARSING: { label: "解析中", color: "text-blue-500" },
    DOWNLOADING: { label: "下载中", color: "text-blue-500" },
    TRANSCRIBING: { label: "转录中", color: "text-purple-500" },
    SUMMARIZING: { label: "总结中", color: "text-indigo-500" },
    FORMATTING: { label: "格式化", color: "text-cyan-500" },
    SAVING: { label: "保存中", color: "text-green-400" },
    SUCCESS: { label: "已完成", color: "text-green-500" },
    FAILED: { label: "失败", color: "text-red-500" },
};
