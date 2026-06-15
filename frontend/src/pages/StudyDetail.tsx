import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useStore, statusFor, nowText, nextId, nextCommentId } from "@/lib/store";
import { createApplicationApi, createCommentApi, deleteCommentApi, updateCommentApi, updateStudyApi } from "@/lib/api";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MapPin, Calendar, Users, Briefcase, CheckCircle2, AlertCircle, Clock, Send, MessageCircle, Trash2, LogIn, PencilLine, LockOpen, Save, X } from "lucide-react";
import { motion } from "framer-motion";

function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function StudyDetail() {
  const [, params] = useRoute("/studies/:id");
  const [, setLocation] = useLocation();
  const { state, updateState, syncFromApi } = useStore();

  const studyId = params?.id ? parseInt(params.id, 10) : 0;
  const study = state.studies.find(s => s.id === studyId);
  const currentUser = state.users.find(u => u.userId === state.currentUserId);

  const [message, setMessage] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [level, setLevel] = useState("초급");
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

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

  const status = statusFor(study);
  const isClosed = status === "모집 마감";
  const isFull = study.current >= study.capacity;
  const fillPercent = Math.min((study.current / study.capacity) * 100, 100);
  const currentUserId = currentUser?.userId || "";
  const isOwner = currentUserId === study.recruiterId;
  const myApplication = currentUser ? state.applications.find(a => a.studyId === studyId && a.applicantId === currentUserId && a.status !== "취소됨") : undefined;
  const comments = state.comments[studyId.toString()] || [];
  const applicationsCount = state.applications.filter(app => app.studyId === studyId).length;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setLocation("/login");
      return;
    }
    if (!message.trim() || !availableTime.trim() || myApplication || isClosed || isOwner) return;

    const nextApplication = {
      id: nextId(state.applications),
      applicantId: currentUser.userId,
      applicantName: currentUser.name,
      studyId: study.id,
      studyTitle: study.title,
      message: message.trim(),
      availableTime: availableTime.trim(),
      level,
      status: "신청 완료" as const,
      createdAt: nowText(),
      decidedAt: ""
    };

    try {
      const savedApplication = await createApplicationApi(nextApplication);
      updateState(draft => {
        draft.applications = [savedApplication, ...draft.applications.filter(app => app.id !== savedApplication.id)];
        draft.events.unshift(
          { message: `${currentUser.name}님이 ${study.title}에 API로 신청했습니다.`, createdAt: nowText() },
          { message: `${study.title} 신청 이벤트가 RabbitMQ로 발행되었습니다.`, createdAt: nowText() }
        );
      });
      await syncFromApi();
    } catch (error) {
      updateState(draft => {
        draft.applications.push(nextApplication);
        draft.events.unshift(
          { message: `${currentUser.name}님이 ${study.title}에 로컬로 신청했습니다. Docker API 상태를 확인하세요.`, createdAt: nowText() },
          { message: `${study.title} 신청 상태가 신청 완료로 변경되었습니다.`, createdAt: nowText() }
        );
      });
    }

    setMessage("");
    setAvailableTime("");
    setLevel("초급");
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setLocation("/login");
      return;
    }
    if (!commentContent.trim()) return;

    try {
      const savedComment = await createCommentApi(studyId, currentUser.userId, commentContent.trim());
      updateState(draft => {
        const key = studyId.toString();
        if (!draft.comments[key]) draft.comments[key] = [];
        draft.comments[key].push(savedComment);
        draft.events.unshift({
          message: `${currentUser.name}님이 ${study.title}에 댓글을 API로 등록했습니다.`,
          createdAt: nowText()
        });
      });
    } catch (error) {
      updateState(draft => {
        const key = studyId.toString();
        if (!draft.comments[key]) {
          draft.comments[key] = [];
        }
        draft.comments[key].push({
          id: nextCommentId(draft.comments),
          authorId: currentUser.userId,
          content: commentContent.trim(),
          createdAt: nowText()
        });
        draft.events.unshift({
          message: `${currentUser.name}님이 ${study.title}에 댓글을 로컬로 남겼습니다. Docker API 상태를 확인하세요.`,
          createdAt: nowText()
        });
      });
    }
    setCommentContent("");
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteCommentApi(commentId);
    } catch (error) {}

    updateState(draft => {
      const key = studyId.toString();
      draft.comments[key] = (draft.comments[key] || []).filter(comment => comment.id !== commentId);
    });
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
      setEditingCommentContent("");
    }
  };

  const handleStartEditComment = (commentId: number, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentContent(content);
  };

  const handleUpdateComment = async (commentId: number) => {
    const nextContent = editingCommentContent.trim();
    if (!nextContent) return;

    try {
      await updateCommentApi(commentId, nextContent);
    } catch (error) {}

    updateState(draft => {
      const key = studyId.toString();
      const target = (draft.comments[key] || []).find(comment => comment.id === commentId);
      if (!target || target.authorId !== currentUserId) return;
      target.content = nextContent;
      target.createdAt = `${nowText()} 수정`;
      draft.events.unshift({
        message: `${currentUser?.name || currentUserId}님이 ${study.title} 댓글을 수정했습니다.`,
        createdAt: nowText()
      });
    });
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleCloseStudy = async () => {
    if (!currentUser || !isOwner) return;
    try {
      const savedStudy = await updateStudyApi({ ...study, status: "모집 마감" });
      updateState(draft => {
        const index = draft.studies.findIndex(s => s.id === savedStudy.id);
        if (index >= 0) draft.studies[index] = savedStudy;
        draft.events.unshift({
          message: `${savedStudy.title} 모집이 API에서 마감되었습니다.`,
          createdAt: nowText()
        });
      });
      return;
    } catch (error) {}

    updateState(draft => {
      const target = draft.studies.find(s => s.id === study.id);
      if (!target) return;
      target.status = "모집 마감";
      draft.events.unshift({
        message: `${target.title} 모집이 마감되었습니다.`,
        createdAt: nowText()
      });
    });
  };

  const handleReopenStudy = async () => {
    if (!currentUser || !isOwner) return;
    if (study.current >= study.capacity) {
      alert("현재 인원이 모집 인원과 같아 모집중으로 변경할 수 없습니다. 모집 인원을 늘려주세요.");
      return;
    }

    try {
      const savedStudy = await updateStudyApi({ ...study, status: "모집 중" });
      updateState(draft => {
        const index = draft.studies.findIndex(s => s.id === savedStudy.id);
        if (index >= 0) draft.studies[index] = savedStudy;
        draft.events.unshift({
          message: `${savedStudy.title} 모집이 API에서 다시 시작되었습니다.`,
          createdAt: nowText()
        });
      });
      return;
    } catch (error) {}

    updateState(draft => {
      const target = draft.studies.find(s => s.id === study.id);
      if (!target) return;
      target.status = "모집 중";
      draft.events.unshift({
        message: `${target.title} 모집이 다시 시작되었습니다.`,
        createdAt: nowText()
      });
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden mb-8 shadow-sm"
        >
          <div className={`h-3 w-full ${isClosed ? "bg-muted" : "bg-gradient-to-r from-primary to-blue-400"}`} />
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{study.field}</Badge>
              <Badge variant="outline">{study.mode}</Badge>
              <Badge variant="outline">{study.level}</Badge>
              <Badge
                variant={isClosed ? "secondary" : "default"}
                className={isClosed ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none"}
              >
                {status}
              </Badge>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-bold">{study.title}</h1>
              {isOwner && (
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setLocation(`/studies/${study.id}/edit`)}>
                    <PencilLine className="h-4 w-4" /> 내용 수정
                  </Button>
                  {isClosed ? (
                    <Button variant="outline" size="sm" className="gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50" onClick={handleReopenStudy}>
                      <LockOpen className="h-4 w-4" /> 모집중으로 변경
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-1" onClick={handleCloseStudy}>
                      모집 마감
                    </Button>
                  )}
                </div>
              )}
            </div>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {study.description}
            </p>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">스터디 목표</h3>
              <div className="flex flex-wrap gap-2">
                {study.goals.map((goal) => (
                  <span key={goal} className="px-3 py-1.5 bg-muted rounded-full text-sm font-medium text-foreground">
                    {goal}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-muted/30 rounded-xl">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground mb-1 flex items-center"><Users className="w-4 h-4 mr-2" />모집자</span>
                <span className="font-semibold">{study.recruiterName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground mb-1 flex items-center"><Calendar className="w-4 h-4 mr-2" />일정</span>
                <span className="font-semibold">{study.schedule}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground mb-1 flex items-center"><MapPin className="w-4 h-4 mr-2" />장소</span>
                <span className="font-semibold">{study.location}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground mb-1 flex items-center"><Briefcase className="w-4 h-4 mr-2" />모집 인원</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{study.current} / {study.capacity}명</span>
                  <Progress value={fillPercent} className="w-20 h-2" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 mb-8">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">상세 정보</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{study.purpose}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground mb-1">진행 기간</div>
                <div className="font-semibold">{study.period}</div>
              </div>
              <div className="rounded-xl bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground mb-1">모집 마감일</div>
                <div className="font-semibold">{study.deadline}</div>
              </div>
              <div className="rounded-xl bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground mb-1">현재 신청자</div>
                <div className="font-semibold">{applicationsCount}명</div>
              </div>
              <div className="rounded-xl bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground mb-1">난이도</div>
                <div className="font-semibold">{study.level}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">참여 조건</h3>
                <InfoList items={study.requirements} />
              </div>
              <div>
                <h3 className="font-semibold mb-3">준비물</h3>
                <InfoList items={study.materials} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
              {study.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-sm h-fit"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center"><Send className="w-5 h-5 mr-2 text-primary" /> 스터디 신청</h2>

            {!currentUser ? (
              <div className="border rounded-xl p-6 bg-muted/20 text-center">
                <LogIn className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-1">로그인이 필요합니다</h3>
                <p className="text-muted-foreground text-sm mb-5">로그인 후 신청 메시지와 참여 가능 시간을 제출할 수 있습니다.</p>
                <Button onClick={() => setLocation("/login")} className="w-full">로그인하기</Button>
              </div>
            ) : isOwner ? (
              <div className="border rounded-xl p-6 bg-primary/5 text-center">
                <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-1">내가 등록한 스터디입니다</h3>
                <p className="text-muted-foreground text-sm mb-5">신청자 목록에서 수락과 거절을 관리할 수 있습니다.</p>
                <Button onClick={() => setLocation("/my")} className="w-full">신청 관리로 이동</Button>
              </div>
            ) : myApplication ? (
              <div className="border rounded-xl p-6 bg-muted/10 text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  {myApplication.status === "신청 완료" || myApplication.status === "검토 중" ? <Clock className="w-6 h-6" /> : null}
                  {myApplication.status === "수락됨" ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : null}
                  {myApplication.status === "거절됨" || myApplication.status === "취소됨" ? <AlertCircle className="w-6 h-6 text-destructive" /> : null}
                </div>
                <h3 className="text-lg font-bold mb-2">{myApplication.status}</h3>
                <p className="text-muted-foreground mb-4">작성한 메시지: "{myApplication.message}"</p>
                <div className="text-sm text-muted-foreground mb-4">참여 가능 시간: {myApplication.availableTime}</div>
              </div>
            ) : isClosed ? (
              <div className="border rounded-xl p-6 bg-muted/30 text-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-1">{isFull ? "해당 스터디는 인원이 다 찼습니다" : "모집이 마감되었습니다"}</h3>
                <p className="text-muted-foreground text-sm">{isFull ? "정원이 모두 채워져 현재 신청할 수 없습니다." : "이 스터디는 현재 신청을 받지 않습니다."}</p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">신청자</label>
                  <Input value={`${currentUser.name} (${currentUser.nickname})`} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">신청 메시지</label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] resize-none"
                    placeholder="스터디에 참여하고 싶은 이유, 목표, 각오를 작성해주세요."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">참여 가능 시간</label>
                  <Input
                    placeholder="예: 화/목 오후 8시 참여 가능"
                    value={availableTime}
                    onChange={(e) => setAvailableTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">학습 수준</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="입문">입문</option>
                    <option value="초급">초급</option>
                    <option value="중급">중급</option>
                    <option value="고급">고급</option>
                  </select>
                </div>
                <Button type="submit" size="lg" className="w-full">이 스터디 신청</Button>
              </form>
            )}
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-primary" />
            댓글 및 문의 ({comments.length})
          </h2>

          <div className="space-y-4 mb-6">
            {comments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-xl bg-muted/10">
                아직 작성된 댓글이 없습니다.
              </div>
            ) : (
              comments.map(comment => {
                const author = state.users.find(u => u.userId === comment.authorId);
                const authorName = author ? `${author.name}${author.nickname ? ` (${author.nickname})` : ""}` : comment.authorId;
                const isHostComment = author?.userId === study.recruiterId;
                const canDelete = currentUserId === comment.authorId;
                const canEdit = currentUserId === comment.authorId;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div key={comment.id} className={`p-4 rounded-xl border ${isHostComment ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent"}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{authorName}</span>
                        {isHostComment && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">모집자</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                        {canEdit && (
                          <Button aria-label="댓글 수정" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleStartEditComment(comment.id, comment.content)}>
                            <PencilLine className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button aria-label="댓글 삭제" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteComment(comment.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[88px] resize-none"
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => { setEditingCommentId(null); setEditingCommentContent(""); }}>
                            <X className="h-4 w-4" /> 취소
                          </Button>
                          <Button type="button" size="sm" className="gap-1" onClick={() => handleUpdateComment(comment.id)}>
                            <Save className="h-4 w-4" /> 저장
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleAddComment} className="mt-auto">
            <div className="flex flex-col md:flex-row gap-2">
              <textarea
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[72px] resize-none"
                placeholder={currentUser ? "궁금한 점을 남겨주세요." : "로그인 후 댓글을 작성할 수 있습니다."}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                required
                disabled={!currentUser}
              />
              <Button type="submit" className="md:w-28 md:h-auto" disabled={!currentUser}>
                등록
              </Button>
            </div>
            {!currentUser && (
              <Button type="button" variant="outline" className="mt-3 w-full md:w-auto" onClick={() => setLocation("/login")}>
                로그인 후 문의하기
              </Button>
            )}
          </form>
        </motion.section>
      </div>
    </Layout>
  );
}
