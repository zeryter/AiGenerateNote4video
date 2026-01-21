import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";

interface DropZoneProps {
    isDragging: boolean;
}

export default function DropZone({ isDragging }: DropZoneProps) {
    return (
        <AnimatePresence>
            {isDragging && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-3xl flex items-center justify-center pointer-events-none"
                // pointer-events-none ensures it doesn't block the drop event bubbling to parent 
                // BUT for visual feedback overlay, usually the parent handles the drop.
                >
                    <div className="flex flex-col items-center gap-4 text-primary">
                        <Upload size={48} />
                        <p className="text-xl font-medium">释放文件以上传</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
