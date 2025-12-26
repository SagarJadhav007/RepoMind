import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  Heart,
  Settings,
  Users,
  KanbanSquare,
  MessageSquare,
  History,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  FolderGit2,
  GitBranch,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/workspace/demo", icon: LayoutDashboard },
  { name: "Health", href: "/workspace/demo/health", icon: Heart },
  { name: "Manage", href: "/workspace/demo/manage", icon: Settings },
  { name: "Contributors", href: "/workspace/demo/contributors", icon: Users },
  { name: "Planning", href: "/workspace/demo/planning", icon: KanbanSquare },
  { name: "AI Assistant", href: "/workspace/demo/assistant", icon: MessageSquare },
  { name: "Activity", href: "/workspace/demo/activity", icon: History },
];

const projects = [
  { name: "repomind-core", status: "active" },
  { name: "repomind-cli", status: "active" },
  { name: "docs-website", status: "inactive" },
];

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
          <div className="h-4 w-px bg-border" />
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            <span className="font-semibold text-foreground">RepoMind</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link to="/workspace/demo/profile">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <User className="h-4 w-4" />
                <span className="sr-only">Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 border-r border-border bg-card/50 transition-all duration-300 flex flex-col",
            sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
          )}
        >
          <nav className="flex flex-col gap-1 p-4 flex-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Projects Section */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Projects</span>
            </div>
            <div className="flex flex-col gap-1">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                >
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate">{project.name}</span>
                  <span
                    className={cn(
                      "ml-auto h-2 w-2 rounded-full shrink-0",
                      project.status === "active" ? "bg-green-500" : "bg-muted-foreground/40"
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
