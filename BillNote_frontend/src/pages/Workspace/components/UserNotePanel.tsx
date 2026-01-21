import { useState } from "react";
import { FileText, Sparkles, PenLine, Eye } from "lucide-react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { formatTime } from "@/utils/mediaHelper";

interface UserNotePanelProps {
    myNote: string;
    onNoteChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    getCurrentTime: () => number;
    onSeek: (time: number) => void;
}

export default function UserNotePanel({ myNote, onNoteChange, getCurrentTime, onSeek }: UserNotePanelProps) {
    const [rightTab, setRightTab] = useState<"my_note" | "mindmap">("my_note");
    const [isMyNotePreview, setIsMyNotePreview] = useState(false);

    const handleMyNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Ctrl + t: Insert Timestamp
        if (e.ctrlKey && e.key === "t") {
            e.preventDefault();

            const currentTime = getCurrentTime();
            const timeStr = formatTime(currentTime);
            const linkText = `[${timeStr}](#t=${Math.floor(currentTime)})`;

            // Insert at cursor
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const newText = text.substring(0, start) + linkText + text.substring(end);

            // Create a synthetic event to trigger onNoteChange
            const syntheticEvent = {
                target: { value: newText }
            } as React.ChangeEvent<HTMLTextAreaElement>;

            onNoteChange(syntheticEvent);

            // Move cursor after insertion
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + linkText.length;
                textarea.focus();
            }, 0);
        }
    };

    // Custom link click handler for MarkdownPreview to support #t= jump
    const onLinkClick = (href: string) => {
        if (href && href.includes("#t=")) {
            const timePart = href.split("#t=")[1];
            if (timePart) {
                const seconds = parseInt(timePart, 10);
                if (!isNaN(seconds)) {
                    onSeek(seconds);
                    return true; // prevent default handled
                }
            }
        }
        return false;
    };

    return (
        <div className="h-full w-full p-4 flex flex-col">
            <div className="bg-card/30 rounded-xl border border-border/50 backdrop-blur-sm h-full flex flex-col overflow-hidden">
                <div className="flex items-center gap-1 p-2 border-b border-border/50">
                    <button
                        onClick={() => setRightTab("my_note")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${rightTab === "my_note" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                    >
                        <div className="flex items-center gap-1.5">
                            <FileText size={14} />
                            <span>我的笔记</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setRightTab("mindmap")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${rightTab === "mindmap" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                    >
                        <div className="flex items-center gap-1.5">
                            <Sparkles size={14} />
                            <span>思维导图</span>
                        </div>
                    </button>
                </div>
                {rightTab === "my_note" && (
                    <div className="flex items-center px-2 py-1 border-b border-border/30 bg-card/20 justify-end">
                        <button
                            onClick={() => setIsMyNotePreview(!isMyNotePreview)}
                            className="p-1 px-2 rounded hover:bg-muted/50 text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                            title={isMyNotePreview ? "切换到编辑模式" : "切换到预览模式"}
                        >
                            {isMyNotePreview ? <PenLine size={12} /> : <Eye size={12} />}
                            <span>{isMyNotePreview ? "编辑" : "预览"}</span>
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-hidden relative">
                    {rightTab === "my_note" ? (
                        isMyNotePreview ? (
                            <div className="h-full w-full overflow-auto p-4 custom-scrollbar bg-transparent">
                                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
                                    <MarkdownPreview
                                        source={myNote || "*暂无笔记内容*"}
                                        style={{ backgroundColor: "transparent", color: "inherit" }}
                                        wrapperElement={{ "data-color-mode": "dark" }}
                                        components={{
                                            a: ({ node, ...props }) => {
                                                return (
                                                    <a
                                                        {...props}
                                                        onClick={(e) => {
                                                            if (props.href && onLinkClick(props.href)) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="text-primary hover:underline cursor-pointer"
                                                    />
                                                )
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <textarea
                                value={myNote}
                                onChange={onNoteChange}
                                onKeyDown={handleMyNoteKeyDown}
                                placeholder="在此输入您的笔记... (Ctrl + t 插入当前视频时间戳)"
                                className="w-full h-full bg-transparent p-4 resize-none focus:outline-none text-sm leading-relaxed text-foreground placeholder:text-muted-foreground font-mono"
                            />
                        )
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <p>思维导图功能开发中...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
