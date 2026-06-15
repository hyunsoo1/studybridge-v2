import Navbar from "./Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
      <footer className="border-t border-border bg-muted/30 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">StudyBridge</p>
          <p>© {new Date().getFullYear()} StudyBridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}