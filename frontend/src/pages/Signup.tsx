import { useState } from "react";
import { Link, useLocation } from "wouter";
import { STUDY_CATEGORIES, useStore, nowText } from "@/lib/store";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen } from "lucide-react";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { state, updateState } = useStore();

  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [interestCategory, setInterestCategory] = useState(STUDY_CATEGORIES[0]);
  const [role, setRole] = useState<"student" | "host">("student");
  const [error, setError] = useState("");

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const nextUserId = userId.trim();
    const nextName = name.trim();
    const nextNickname = nickname.trim();

    if (state.users.some(u => u.userId === nextUserId)) {
      setError("이미 사용 중인 아이디입니다.");
      return;
    }

    if (password.length < 4) {
      setError("비밀번호는 4자 이상으로 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    updateState(draft => {
      draft.users.push({
        userId: nextUserId,
        name: nextName,
        nickname: nextNickname,
        password,
        email: email.trim(),
        university: university.trim(),
        major: major.trim(),
        interestCategory,
        role,
        createdAt: nowText()
      });
      draft.currentUserId = nextUserId;
      draft.events.unshift({
        message: `${nextName}님이 StudyBridge에 가입했습니다.`,
        createdAt: nowText()
      });
    });

    setLocation("/studies");
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 bg-muted/20">
        <div className="w-full max-w-[calc(100vw-2rem)] md:max-w-2xl bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg">
          <div className="flex justify-center mb-8">
            <div className="bg-primary text-primary-foreground p-3 rounded-xl">
              <BookOpen size={32} className="stroke-[2.5]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">계정 만들기</h1>
          <p className="text-center text-muted-foreground mb-8">스터디 신청과 모집 관리를 시작할 프로필을 입력하세요.</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">아이디</label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="영문, 숫자 포함"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">비밀번호</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="4자 이상 비밀번호"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">비밀번호 확인</label>
                <Input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 재입력"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">이름</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="실명 입력"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">닉네임</label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="댓글과 신청 내역에 표시"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">이메일</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="study@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">학교명</label>
                <Input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="학교명"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">전공</label>
                <Input
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="전공"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">관심 분야</label>
                <select
                  value={interestCategory}
                  onChange={(e) => setInterestCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {STUDY_CATEGORIES.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">사용 목적</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "student" | "host")}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="student">스터디 신청자</option>
                <option value="host">스터디 모집자</option>
              </select>
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="pt-2">
              <Button type="submit" className="w-full h-12 text-base">가입하고 시작하기</Button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm">
            이미 계정이 있으신가요? <Link href="/login" className="text-primary font-medium hover:underline">로그인</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
