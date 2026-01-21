export function detectPlatform(url: string): string {
    if (url.includes("bilibili.com") || url.includes("b23.tv")) return "bilibili";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("douyin.com")) return "douyin";
    return "local"; // fallback for local files
}
