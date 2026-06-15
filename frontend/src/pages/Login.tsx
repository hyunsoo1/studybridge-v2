import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { state, updateState } = useStore();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = state.users.find(u => u.userId === userId && u.password === password);
    
    if (user) {
      updateState(draft => {
        draft.currentUserId = user.userId;
      });
      setLocation("/studies");
    } else {
      setError("아이디 또는 비밀번호가 일치하지 않습니다.");
    }
  };

  const quickLogin = (id: string, pass: string) => {
    const user = state.users.find(u => u.userId === id && u.password === pass);
    setUserId(id);
    setPassword(pass);

    if (user) {
      updateState(draft => {
        draft.currentUserId = user.userId;
      });
      setLocation("/studies");
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 bg-muted/20">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-lg">
          <div className="flex justify-center mb-8">
            <div className="bg-primary text-primary-foreground p-3 rounded-xl">
              <BookOpen size={32} className="stroke-[2.5]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">다시 오신 것을 환영합니다</h1>
          <p className="text-center text-muted-foreground mb-8">당신의 스터디를 관리하고 성장을 이어가세요.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">아이디</label>
              <Input 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">비밀번호</label>
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && <div className="text-sm text-destructive">{error}</div>}
            
            <Button type="submit" className="w-full h-12 text-base mt-2">로그인</Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-center text-muted-foreground mb-4">테스트 계정으로 빠른 로그인</p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => quickLogin("younggu09", "1234")}>
                학생 (younggu09)
              </Button>
              <Button variant="outline" size="sm" onClick={() => quickLogin("host01", "1234")}>
                호스트 (host01)
              </Button>
              <Button variant="outline" size="sm" onClick={() => quickLogin("student02", "1234")}>
                학생 (student02)
              </Button>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm">
            계정이 없으신가요? <Link href="/signup" className="text-primary font-medium hover:underline">회원가입</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
