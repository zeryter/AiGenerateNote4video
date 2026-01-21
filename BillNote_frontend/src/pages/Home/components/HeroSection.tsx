import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function HeroSection() {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center max-w-2xl w-full"
        >
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-8 flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent-foreground text-sm font-medium backdrop-blur-md"
            >
                <Sparkles size={14} className="text-primary" />
                <span>AI-Powered Video Notes</span>
            </motion.div>

            <motion.h1
                className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                Watch Less. <br /> Learn More.
            </motion.h1>

            <motion.p
                className="text-lg text-muted-foreground mb-12 max-w-md"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                粘贴视频链接 (Bilibili, YouTube, 抖音) 或拖拽本地视频，即刻生成 AI 笔记
            </motion.p>
        </motion.div>
    );
}
