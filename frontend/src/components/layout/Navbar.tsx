import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { BookOpen, Menu, X, LogOut, User, Bell, PlusCircle, Search, Network, Activity } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [location] = useLocation();
  const { state, updateState } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentUser = state.users.find(u => u.userId === state.currentUserId);
  const notificationCount = state.events.filter(event => !event.readAt).length;

  const handleLogout = () => {
    updateState(draft => {
      draft.currentUserId = "";
    });
  };

  const navLinks = [
    { href: "/studies", label: "스터디 찾기", icon: Search },
    { href: "/create", label: "스터디 만들기", icon: PlusCircle },
    { href: "/architecture", label: "MSA 설계", icon: Network },
    { href: "/msa-demo", label: "API 시연", icon: Activity },
  ];

  if (currentUser) {
    if (currentUser.role === "host") {
      navLinks.push({ href: "/my", label: "신청 관리", icon: User });
    } else {
      navLinks.push({ href: "/my", label: "신청 내역", icon: User });
    }
  } else {
    navLinks.push({ href: "/my", label: "신청 내역", icon: User });
  }

  const isActive = (path: string) => location.startsWith(path);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight transition-colors hover:text-primary/80">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <BookOpen size={20} className="stroke-[2.5]" />
          </div>
          StudyBridge
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.href) ? "text-primary" : "text-muted-foreground"}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/activity" aria-label="알림" title="알림">
            <Button
              variant={isActive("/activity") ? "outline" : "ghost"}
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
              )}
            </Button>
          </Link>
          {currentUser ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">{currentUser.name}님</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut size={18} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="font-medium">로그인</Button>
              </Link>
              <Link href="/signup">
                <Button className="font-medium shadow-sm">회원가입</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-1">
          <Link href="/activity" aria-label="알림" title="알림">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              )}
            </Button>
          </Link>
          <button className="p-2 -mr-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="h-px bg-border my-2" />
            {currentUser ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-foreground">{currentUser.name}님</span>
                <Button variant="ghost" size="sm" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-muted-foreground hover:text-foreground gap-2">
                  <LogOut size={16} /> 로그아웃
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">로그인</Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center">회원가입</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
