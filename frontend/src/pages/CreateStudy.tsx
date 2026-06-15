import { useState } from "react";
import { useLocation } from "wouter";
import { STUDY_CATEGORIES, STUDY_LEVELS, useStore, nextId, nowText, type StudyMode } from "@/lib/store";
import { createStudyApi } from "@/lib/api";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";

const modes: StudyMode[] = ["온라인", "오프라인", "온·오프라인 병행"];

const parseList = (value: string) => {
  return value
    .split(/\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
};

export default function CreateStudy() {
  const [, setLocation] = useLocation();
  const { state, updateState, syncFromApi } = useStore();

  const currentUser = state.users.find(u => u.userId === state.currentUserId);

  const [title, setTitle] = useState("");
  const [field, setField] = useState(STUDY_CATEGORIES[0]);
  const [capacity, setCapacity] = useState("4");
  const [mode, setMode] = useState<StudyMode>("온라인");
  const [schedule, setSchedule] = useState("매주 화요일, 목요일 오후 8시");
  const [period, setPeriod] = useState("2026-06-16 ~ 2026-08-20");
  const [deadline, setDeadline] = useState("2026-06-14");
  const [location, setStudyLocation] = useState("Zoom");
  const [level, setLevel] = useState("초급");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [requirements, setRequirements] = useState("매주 2회 이상 참여 가능\n과제 제출 가능\n단체 채팅방 참여 가능");
  const [materials, setMaterials] = useState("노트북\nNotion 계정\n온라인 회의 환경");
  const [tags, setTags] = useState("자격증, 온라인, 기출");
  const [goals, setGoals] = useState("기출문제 풀이\n오답 리뷰\n개념 정리");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setLocation("/login");
      return;
    }

    setIsSubmitting(true);

    const nextStudy = {
      id: nextId(state.studies),
      title: title.trim(),
      field,
      recruiterId: currentUser.userId,
      recruiterName: currentUser.name,
      capacity: parseInt(capacity, 10),
      current: 1,
      mode,
      status: "모집 중" as const,
      level,
      schedule: schedule.trim(),
      period: period.trim(),
      deadline,
      location: location.trim(),
      description: description.trim(),
      purpose: purpose.trim() || description.trim(),
      requirements: parseList(requirements),
      materials: parseList(materials),
      goals: parseList(goals),
      tags: parseList(tags)
    };

    try {
      const savedStudy = await createStudyApi(nextStudy);
      updateState(draft => {
        draft.studies = [savedStudy, ...draft.studies.filter(study => study.id !== savedStudy.id)];
        const user = draft.users.find(item => item.userId === currentUser.userId);
        if (user) user.role = "host";
        draft.events.unshift({
          message: `${currentUser.name}님이 ${savedStudy.title} 스터디를 API로 등록했습니다.`,
          createdAt: nowText()
        });
      });
      await syncFromApi();
      setLocation("/studies");
    } catch (error) {
      updateState(draft => {
        draft.studies.push(nextStudy);
        const user = draft.users.find(item => item.userId === currentUser.userId);
        if (user) user.role = "host";
        draft.events.unshift({
          message: `${currentUser.name}님이 ${nextStudy.title} 스터디를 로컬로 등록했습니다. Docker API 상태를 확인하세요.`,
          createdAt: nowText()
        });
      });
      setLocation("/studies");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-lg">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center">
            <LogIn className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold mb-2">로그인이 필요합니다</h1>
            <p className="text-muted-foreground mb-6">스터디 모집글 등록은 로그인한 사용자만 이용할 수 있습니다.</p>
            <Button onClick={() => setLocation("/login")} className="w-full">로그인하기</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">스터디 만들기</h1>
            <p className="text-muted-foreground">모집 조건, 일정, 신청자가 확인할 정보를 한 번에 등록하세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">스터디 제목</label>
                <Input
                  placeholder="예: 정보처리기사 실기 스터디"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">분야</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                  >
                    {STUDY_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">모집 인원</label>
                  <Input
                    type="number"
                    min="2"
                    max="20"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">난이도</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    {STUDY_LEVELS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">진행 방식</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as StudyMode)}
                  >
                    {modes.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">진행 장소</label>
                  <Input
                    placeholder="Zoom, 중앙도서관 스터디룸 등"
                    value={location}
                    onChange={(e) => setStudyLocation(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">모집 마감일</label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">진행 일정</label>
                  <Input
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">진행 기간</label>
                  <Input
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">간단한 소개</label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px] resize-none"
                  placeholder="카드와 상세 페이지에 보일 스터디 소개를 적어주세요."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">모집 목적</label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px] resize-none"
                  placeholder="왜 이 스터디를 모집하는지, 어떤 결과를 기대하는지 적어주세요."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">참여 조건</label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] resize-none"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">준비물</label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] resize-none"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">스터디 목표</label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px] resize-none"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">태그</label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px] resize-none"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "등록 중..." : "스터디 등록하기"}
            </Button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
