import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { STUDY_CATEGORIES, STUDY_LEVELS, useStore, nowText, type StudyMode, type StudyStatus } from "@/lib/store";
import { updateStudyApi } from "@/lib/api";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { LogIn, PencilLine } from "lucide-react";

const modes: StudyMode[] = ["온라인", "오프라인", "온·오프라인 병행"];
const statuses: StudyStatus[] = ["모집 중", "모집 마감"];

const parseList = (value: string) => {
  return value
    .split(/\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
};

const joinList = (items: string[]) => items.join("\n");

export default function EditStudy() {
  const [, params] = useRoute("/studies/:id/edit");
  const [, setLocation] = useLocation();
  const { state, updateState, syncFromApi } = useStore();

  const studyId = params?.id ? parseInt(params.id, 10) : 0;
  const study = state.studies.find(s => s.id === studyId);
  const currentUser = state.users.find(u => u.userId === state.currentUserId);

  const [title, setTitle] = useState(study?.title || "");
  const [field, setField] = useState(study?.field || STUDY_CATEGORIES[0]);
  const [capacity, setCapacity] = useState(String(study?.capacity || 4));
  const [mode, setMode] = useState<StudyMode>(study?.mode || "온라인");
  const [schedule, setSchedule] = useState(study?.schedule || "");
  const [period, setPeriod] = useState(study?.period || "");
  const [deadline, setDeadline] = useState(study?.deadline || "");
  const [location, setStudyLocation] = useState(study?.location || "");
  const [level, setLevel] = useState(study?.level || "초급");
  const [status, setStatus] = useState<StudyStatus>(study?.status || "모집 중");
  const [description, setDescription] = useState(study?.description || "");
  const [purpose, setPurpose] = useState(study?.purpose || "");
  const [requirements, setRequirements] = useState(joinList(study?.requirements || []));
  const [materials, setMaterials] = useState(joinList(study?.materials || []));
  const [goals, setGoals] = useState(joinList(study?.goals || []));
  const [tags, setTags] = useState((study?.tags || []).join(", "));
  const [notice, setNotice] = useState("");

  if (!currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-lg">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center">
            <LogIn className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold mb-2">로그인이 필요합니다</h1>
            <p className="text-muted-foreground mb-6">스터디 수정은 로그인한 모집자만 이용할 수 있습니다.</p>
            <Button onClick={() => setLocation("/login")} className="w-full">로그인하기</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!study) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">스터디를 찾을 수 없습니다.</h2>
          <Button onClick={() => setLocation("/studies")}>목록으로 돌아가기</Button>
        </div>
      </Layout>
    );
  }

  if (currentUser.userId !== study.recruiterId) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <h2 className="text-2xl font-bold mb-4">수정 권한이 없습니다.</h2>
          <p className="text-muted-foreground mb-6">이 스터디를 만든 모집자만 내용을 수정할 수 있습니다.</p>
          <Button onClick={() => setLocation(`/studies/${study.id}`)}>상세 페이지로 돌아가기</Button>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCapacity = Math.max(parseInt(capacity, 10) || study.capacity, study.current);
    const nextStatus: StudyStatus = parsedCapacity <= study.current ? "모집 마감" : status;
    const nextStudy = {
      ...study,
      title: title.trim(),
      field,
      capacity: parsedCapacity,
      mode,
      status: nextStatus,
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
      const savedStudy = await updateStudyApi(nextStudy);
      updateState(draft => {
        const index = draft.studies.findIndex(s => s.id === savedStudy.id);
        if (index >= 0) draft.studies[index] = savedStudy;
        draft.applications.forEach(app => {
          if (app.studyId === savedStudy.id) app.studyTitle = savedStudy.title;
        });
        draft.events.unshift({
          message: `${currentUser.name}님이 ${savedStudy.title} 스터디 정보를 API로 수정했습니다.`,
          createdAt: nowText()
        });
      });
      await syncFromApi();
      setNotice(nextStatus === "모집 마감" && status === "모집 중" ? "현재 인원이 모집 인원과 같아 모집 마감 상태로 저장되었습니다." : "스터디 정보가 API와 DB에 저장되었습니다.");
      setTimeout(() => setLocation(`/studies/${study.id}`), 500);
      return;
    } catch (error) {}

    updateState(draft => {
      const target = draft.studies.find(s => s.id === study.id);
      if (!target) return;

      target.title = title.trim();
      target.field = field;
      target.capacity = parsedCapacity;
      target.mode = mode;
      target.status = nextStatus;
      target.level = level;
      target.schedule = schedule.trim();
      target.period = period.trim();
      target.deadline = deadline;
      target.location = location.trim();
      target.description = description.trim();
      target.purpose = purpose.trim() || description.trim();
      target.requirements = parseList(requirements);
      target.materials = parseList(materials);
      target.goals = parseList(goals);
      target.tags = parseList(tags);

      draft.applications.forEach(app => {
        if (app.studyId === target.id) app.studyTitle = target.title;
      });

      draft.events.unshift({
        message: `${currentUser.name}님이 ${target.title} 스터디 정보를 수정했습니다.`,
        createdAt: nowText()
      });
    });

    setNotice(nextStatus === "모집 마감" && status === "모집 중" ? "현재 인원이 모집 인원과 같아 모집 마감 상태로 저장되었습니다." : "스터디 정보가 수정되었습니다.");
    setTimeout(() => setLocation(`/studies/${study.id}`), 500);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PencilLine className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold mb-2">스터디 수정</h1>
            <p className="text-muted-foreground">모집글 내용, 모집 상태, 일정, 인원을 수정할 수 있습니다.</p>
          </div>

          {notice && (
            <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">스터디 제목</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">분야</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={field} onChange={(e) => setField(e.target.value)}>
                    {STUDY_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">모집 인원</label>
                  <Input type="number" min={study.current} max="20" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
                  <p className="mt-1 text-xs text-muted-foreground">현재 인원보다 작게 줄일 수 없습니다.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">난이도</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={level} onChange={(e) => setLevel(e.target.value)}>
                    {STUDY_LEVELS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">모집 상태</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={status} onChange={(e) => setStatus(e.target.value as StudyStatus)}>
                    {statuses.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">진행 방식</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={mode} onChange={(e) => setMode(e.target.value as StudyMode)}>
                    {modes.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">진행 장소</label>
                  <Input value={location} onChange={(e) => setStudyLocation(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">모집 마감일</label>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">진행 일정</label>
                  <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">진행 기간</label>
                  <Input value={period} onChange={(e) => setPeriod(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">간단한 소개</label>
                <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px] resize-none" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">모집 목적</label>
                <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px] resize-none" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">참여 조건</label>
                  <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] resize-none" value={requirements} onChange={(e) => setRequirements(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">준비물</label>
                  <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] resize-none" value={materials} onChange={(e) => setMaterials(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">스터디 목표</label>
                  <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px] resize-none" value={goals} onChange={(e) => setGoals(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">태그</label>
                  <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px] resize-none" value={tags} onChange={(e) => setTags(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="outline" className="sm:w-40" onClick={() => setLocation(`/studies/${study.id}`)}>취소</Button>
              <Button type="submit" size="lg" className="flex-1">수정 내용 저장</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
