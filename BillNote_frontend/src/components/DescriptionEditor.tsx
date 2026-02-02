import { useState, useRef, useEffect } from "react";
import { X, Save, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DescriptionEditorProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    initialValue: string;
    onSave: (description: string) => void;
}

export default function DescriptionEditor({
    isOpen,
    onClose,
    title,
    initialValue,
    onSave,
}: DescriptionEditorProps) {
    const [value, setValue] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue, isOpen]);

    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(value.length, value.length);
        }
    }, [isOpen]);

    const handleSave = () => {
        onSave(value.trim());
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            handleSave();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
                    >
                        <div className="bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden mx-4">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <FileText size={16} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">编辑视频说明</h3>
                                        <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                                            {title}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X size={16} className="text-muted-foreground" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <textarea
                                    ref={textareaRef}
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="添加视频说明、笔记、关键时间戳等..."
                                    className="w-full h-32 p-3 bg-background border border-border/50 rounded-xl resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    提示：⌘/Ctrl + Enter 快速保存
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 p-4 border-t border-border/50 bg-muted/30">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    <Save size={14} />
                                    保存
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
