import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Home,
    Layout,
    History,
    Settings,
    Menu,
    ChevronLeft,
    FolderOpen,
    Play,
    Music2,
    Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePlaylistStore } from "@/store/playlistStore";
import { useTaskStore } from "@/store/taskStore";
import toast from "react-hot-toast";

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(true);

    const savedPlaylists = usePlaylistStore(s => s.savedPlaylists);
    const loadPlaylist = usePlaylistStore(s => s.loadPlaylist);
    const removePlaylist = usePlaylistStore(s => s.removePlaylist);
    const currentItems = usePlaylistStore(s => s.items);

    const navItems = [
        { icon: Home, label: "首页", path: "/" },
        { icon: Layout, label: "工作台", path: "/workspace" },
        { icon: History, label: "历史记录", path: "/history" },
        { icon: Settings, label: "设置", path: "/settings" },
    ];

    const setCurrentTask = useTaskStore(s => s.setCurrentTask);

    const handleLoadPlaylist = (playlistId: string) => {
        const lastActiveId = loadPlaylist(playlistId);
        toast.success(lastActiveId ? "已恢复上次播放进度" : "歌单已加载");

        // Use last active task or the first task from current playlist items (which was just updated by loadPlaylist)
        const targetId = lastActiveId || usePlaylistStore.getState().items[0]?.taskId;

        if (targetId) {
            setCurrentTask(targetId);
            navigate(`/workspace?taskId=${targetId}`);
        } else {
            navigate("/workspace");
        }
    };

    return (
        <motion.div
            className={cn(
                "relative h-screen border-r border-border/50 bg-background/60 backdrop-blur-xl flex flex-col transition-all duration-300 z-50",
                isCollapsed ? "w-16" : "w-64"
            )}
            initial={false}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-6 p-1 bg-card border border-border rounded-full hover:bg-primary/10 transition-colors z-50 shadow-sm text-muted-foreground hover:text-primary"
            >
                {isCollapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Logo Area */}
            <div className="h-16 flex items-center justify-center border-b border-border/30">
                <Music2 className={cn("text-primary transition-all", isCollapsed ? "w-6 h-6" : "w-8 h-8 mr-2")} />
                {!isCollapsed && (
                    <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 truncate">
                        BillNote
                    </span>
                )}
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "w-full flex items-center p-2 rounded-lg transition-all group relative",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon size={20} className={cn("shrink-0", isActive && "text-primary")} />
                            {!isCollapsed && (
                                <span className="ml-3 text-sm font-medium">{item.label}</span>
                            )}
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-indicator"
                                    className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full"
                                />
                            )}
                        </button>
                    );
                })}

                {/* Divider */}
                <div className="my-4 border-t border-border/30 mx-2" />

                {/* Playlists Section */}
                <div className="px-2">
                    {!isCollapsed && (
                        <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                            <span>我的歌单</span>
                            <span className="bg-muted/50 px-1.5 py-0.5 rounded text-[10px]">{savedPlaylists.length}</span>
                        </div>
                    )}

                    <div className="space-y-1">
                        {savedPlaylists.map(playlist => (
                            <button
                                key={playlist.id}
                                onClick={() => handleLoadPlaylist(playlist.id)}
                                className={cn(
                                    "w-full flex items-center p-2 rounded-lg transition-all group text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                )}
                                title={isCollapsed ? playlist.name : undefined}
                            >
                                <FolderOpen size={20} className="shrink-0 group-hover:text-primary transition-colors" />
                                {!isCollapsed && (
                                    <>
                                        <div className="ml-3 flex flex-col items-start flex-1 min-w-0">
                                            <span className="text-sm truncate w-full text-left">{playlist.name}</span>
                                            {playlist.lastActiveTaskId && (
                                                <span className="text-[10px] text-primary/70 flex items-center gap-1">
                                                    <Play size={8} className="fill-current" /> 继续播放
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!playlist.lastActiveTaskId && (
                                                <Play size={12} className="text-primary mr-2" />
                                            )}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("确定要删除这个歌单吗？")) {
                                                        removePlaylist(playlist.id);
                                                        toast.success("歌单已删除");
                                                    }
                                                }}
                                                className="p-1 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                title="删除歌单"
                                            >
                                                <Trash2 size={12} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </button>
                        ))}
                    </div>

                    {!isCollapsed && savedPlaylists.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground/50 border border-dashed border-border/50 rounded-lg mx-2">
                            暂无歌单
                        </div>
                    )}
                </div>
            </div>

            {/* Mini Status (Optional: Current Playlist Count) */}
            {currentItems.length > 0 && (
                <div className="p-4 border-t border-border/30 bg-card/20">
                    <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 animate-pulse-slow">
                            <Play size={14} className="text-primary fill-primary" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate text-foreground">当前播放列表</p>
                                <p className="text-[10px] text-muted-foreground truncate">{currentItems.length} 个任务</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
