import { useState } from "react";
import { motion } from "framer-motion";
import { Link as LinkIcon, Loader2, ArrowRight } from "lucide-react";

interface UrlInputProps {
    url: string;
    onUrlChange: (url: string) => void;
    onSubmit: (e?: React.FormEvent) => void;
    isLoading: boolean;
}

export default function UrlInput({ url, onUrlChange, onSubmit, isLoading }: UrlInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <motion.form
            onSubmit={onSubmit}
            className={`relative w-full max-w-xl transition-all duration-300 ${isFocused ? "scale-105 shadow-2xl shadow-primary/20" : "shadow-lg"}`}
            layoutId="search-container"
        >
            <div
                className={`relative flex items-center w-full h-16 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-xl border transition-colors duration-300 ${isFocused ? "border-primary ring-1 ring-primary/50" : "border-border/50 hover:border-primary/50"}`}
            >
                <div className="pl-6 text-muted-foreground">
                    <LinkIcon size={20} />
                </div>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="粘贴视频链接..."
                    className="w-full h-full bg-transparent border-none outline-none px-4 text-lg placeholder:text-muted-foreground/50"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={!url || isLoading}
                    className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground transition-all hover:scale-105 active:scale-95"
                >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                </button>
            </div>
        </motion.form>
    );
}
