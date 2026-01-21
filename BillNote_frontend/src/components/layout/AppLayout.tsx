import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { ThemeProvider } from "../ui/theme-provider";

export function AppLayout() {
    const location = useLocation();

    return (
        <ThemeProvider defaultTheme="dark" storageKey="bilinote-theme">
            <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">

                {/* Background Ambient Gradients */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen opacity-50 animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen opacity-50" />
                </div>

                {/* Content Shell */}
                <div className="relative z-10 flex flex-col h-screen">
                    {/* Header / Nav could go here if needed globally */}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="flex-1 w-full h-full overflow-hidden"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </ThemeProvider>
    );
}
