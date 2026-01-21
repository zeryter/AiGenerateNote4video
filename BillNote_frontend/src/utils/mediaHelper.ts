export function getCoverUrl(url: string): string {
    if (!url) return "";
    // Local backend URLs (static files) - use directly
    if (url.includes("localhost") || url.includes("127.0.0.1") || url.startsWith("/")) {
        return url;
    }
    // External URLs (bilibili CDN, etc.) - use proxy to avoid CORS
    if (url.startsWith("http")) {
        return `/api/image_proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
}

export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function getVideoUrl(url: string, platform?: string, filePath?: string): string {
    const BASE_URL = "http://localhost:8483";

    // Helper to safely encode path
    const getEncodedUrl = (path: string) => {
        try {
            // Check if path is already a full URL
            if (path.startsWith("http")) return path;

            // If path is already encoded (has %), try to decode first to avoid double encoding
            const decodedPath = path.includes("%") ? decodeURIComponent(path) : path;

            // Encode each segment properly
            const encodedPath = decodedPath.split('/').map(segment => encodeURIComponent(segment)).join('/');

            // Construct full URL
            return `${BASE_URL}${encodedPath}`;
        } catch (e) {
            console.error("Error constructing video URL:", e);
            return path;
        }
    };

    // 1. For local uploads, STRICTLY prioritize the original upload URL (formData.video_url)
    // This avoids using the extracted audio file (.mp3) often found in audioMeta.file_path
    if (platform === "local" && url) {
        // Normalize slashes
        const normalizedUrl = url.replace(/\\/g, '/');

        // If it's already a relative /uploads path
        if (normalizedUrl.startsWith("/uploads")) {
            const finalUrl = getEncodedUrl(normalizedUrl);
            return finalUrl;
        }

        // If it's an absolute path containing /uploads/
        if (normalizedUrl.includes("/uploads/")) {
            const parts = normalizedUrl.split("/uploads/");
            if (parts.length > 1) {
                const relativePath = parts[parts.length - 1];
                const encodedRelativePath = relativePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
                const finalUrl = `${BASE_URL}/uploads/${encodedRelativePath}`;
                return finalUrl;
            }
        }
    }

    // 2. Prioritize external URLs (YouTube/Bilibili) if present, BEFORE checking processing artifacts (filePath)
    // This prevents the player from using the downloaded AUDIO file when we want to show the VIDEO iframe.
    if (url) {
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            return url;
        }
        if (url.includes("bilibili.com") || url.includes("b23.tv")) {
            return url;
        }
    }

    // 3. If no local URL or external platform, check filePath (downloaded content)
    if (filePath) {
        const normalizedPath = filePath.replace(/\\/g, '/');

        // Handle note_results (downloaded files)
        if (normalizedPath.includes("note_results/")) {
            const parts = normalizedPath.split("note_results/");
            if (parts.length > 1) {
                const relativePath = parts[parts.length - 1];
                const encodedRelativePath = relativePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
                const finalUrl = `${BASE_URL}/note_results/${encodedRelativePath}`;
                return finalUrl;
            }
        }

        // Handle absolute paths in uploads (fallback)
        if (normalizedPath.includes("/uploads/")) {
            const parts = normalizedPath.split("/uploads/");
            if (parts.length > 1) {
                const relativePath = parts[parts.length - 1];
                const encodedRelativePath = relativePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
                const finalUrl = `${BASE_URL}/uploads/${encodedRelativePath}`;
                return finalUrl;
            }
        }

        if (filePath.startsWith("/")) {
            const finalUrl = getEncodedUrl(filePath);
            return finalUrl;
        }
        return filePath;
    }

    if (!url) return "";

    // YouTube URLs work directly with ReactPlayer
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return url;
    }

    // Bilibili - We will handle this in the component
    if (url.includes("bilibili.com") || url.includes("b23.tv")) {
        return url;
    }

    return url;
}
