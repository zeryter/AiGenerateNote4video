import { useState } from "react";
import { Sparkles, FileText, Loader2 } from "lucide-react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import type { Segment } from "@/store/taskStore";

interface AiNotePanelProps {
    isLoading: boolean;
    markdownContent: string;
    transcriptSegments: Segment[];
}

export default function AiNotePanel({ isLoading, markdownContent, transcriptSegments }: AiNotePanelProps) {
    const [leftTab, setLeftTab] = useState<"ai_note" | "transcript">("ai_note");

    return (
        <div className="flex-1 bg-card/30 rounded-xl border border-border/50 backdrop-blur-sm flex flex-col overflow-hidden">
            <div className="flex items-center gap-1 p-2 border-b border-border/50">
                <button
                    onClick={() => setLeftTab("ai_note")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${leftTab === "ai_note" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                    <div className="flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>智能笔记</span>
                    </div>
                </button>
                <button
                    onClick={() => setLeftTab("transcript")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${leftTab === "transcript" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                    <div className="flex items-center gap-1.5">
                        <FileText size={14} />
                        <span>转录文本</span>
                    </div>
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                {leftTab === "ai_note" ? (
                    isLoading && !markdownContent ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                            <Loader2 size={24} className="animate-spin text-primary" />
                            <p>正在生成笔记...</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted/50 prose-pre:border prose-pre:border/50 text-foreground/90">
                            <MarkdownPreview
                                source={markdownContent || "*笔记内容为空*"}
                                style={{ backgroundColor: "transparent", color: "inherit" }}
                                wrapperElement={{ "data-color-mode": "dark" }}
                            />
                        </div>
                    )
                ) : (
                    <div className="space-y-4">
                        {isLoading && transcriptSegments.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-muted-foreground">
                                <Loader2 size={24} className="animate-spin mr-2" />
                                <span>正在转录...</span>
                            </div>
                        ) : (
                            transcriptSegments.map((seg, idx) => (
                                <div key={idx} className="flex gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                    <span className="text-xs text-muted-foreground w-12 pt-1 font-mono flex-shrink-0 group-hover:text-primary transition-colors">
                                        {new Date(seg.start * 1000).toISOString().substr(14, 5)}
                                    </span>
                                    <p className="text-sm text-foreground/90 leading-relaxed">{seg.text}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
