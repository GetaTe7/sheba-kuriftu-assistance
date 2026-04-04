import { Link, useLocation } from "react-router-dom";
import { Mic, BookOpen, Eye, Compass, Settings, MessageSquare } from "lucide-react";

const navItems = [
  { path: "/", icon: Mic, label: "Assistant" },
  { path: "/cultural-tips", icon: BookOpen, label: "Culture" },
  { path: "/accessibility", icon: Eye, label: "Access" },
  { path: "/experiences", icon: Compass, label: "Explore" },
  { path: "/history", icon: MessageSquare, label: "History" },
  { path: "/admin", icon: Settings, label: "Admin" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display text-sm font-bold">S</span>
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground leading-none">Sheba</h1>
            <p className="text-xs text-muted-foreground">for Kuriftu</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
