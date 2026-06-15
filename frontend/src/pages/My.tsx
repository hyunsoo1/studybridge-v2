import { useState } from "react";
import { useStore, nowText, statusFor } from "@/lib/store";
import { deleteStudyApi, updateApplicationStatusApi, updateStudyApi } from "@/lib/api";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { CheckCircle2, XCircle, Clock, Trash2, Lock, MessageCircle, PencilLine, LockOpen } from "lucide-react";
import { motion } from "framer-motion";

const statusClass = (status: string) => {
  if (status === "수락됨") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (status === "거절됨" || status === "취소됨") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-blue-500/10 text-blue-600 border-blue-500/20";
};

export default function My() {
  const [, setLocation] = useLocation();
  const { state, updateState, syncFromApi } = useStore();
  const [notice, setNotice] = useState("");
  const [showCanceledApps, setShowCanceledApps] = useState(false);
  const currentUser = state.users.find(u => u.userId === state.currentUserId);

  if (!currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-lg">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center">
            <Lock className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold mb-2">로그인이 필요합니다</h1>
            <p className="text-muted-foreground mb-6">내 신청 내역과 모집 관리 화면은 로그인 후 이용할 수 있습니다.</p>
            <Button onClick={() => setLocation("/login")} className="w-full">로그인하기</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const userId = currentUser.userId;
  const myStudies = state.studies.filter(s => s.recruiterId === userId);
  const isHostView = currentUser.role === "host" || myStudies.length > 0;

  if (isHostView) {
    const myStudyIds = myStudies.map(s => s.id);
    const applicationsToMe = state.applications.filter(a => myStudyIds.includes(a.studyId));
    const pendingApps = applicationsToMe.filter(a => a.status === "신청 완료" || a.status === "검토 중");
    const acceptedApps = applicationsToMe.filter(a => a.status === "수락됨");
    const hostComments = myStudyIds.flatMap(id => {
      const study = state.studies.find(item => item.id === id);
      return (state.comments[id.toString()] || []).map(comment => ({ ...comment, studyTitle: study?.title || "" }));
    });

    const handleAccept = async (appId: number) => {
      const app = state.applications.find(a => a.id === appId);
      const study = app ? state.studies.find(s => s.id === app.studyId) : undefined;
      if (!app || !study) return;

      if (study.current >= study.capacity) {
        setNotice("모집 인원이 가득 차 더 이상 신청자를 수락할 수 없습니다.");
        updateState(draft => {
          const targetStudy = draft.studies.find(s => s.id === study.id);
          if (targetStudy) targetStudy.status = "모집 마감";
        });
        return;
      }

      try {
        await updateApplicationStatusApi(appId, "수락됨");
        await updateStudyApi({
          ...study,
          current: Math.min(study.current + 1, study.capacity),
          status: study.current + 1 >= study.capacity ? "모집 마감" : study.status
        });
        await syncFromApi();
        setNotice("API로 신청을 수락했습니다. apply-service가 RabbitMQ 알림 이벤트를 발행했습니다.");
        return;
      } catch (error) {}

      updateState(draft => {
        const targetApp = draft.applications.find(a => a.id === appId);
        const targetStudy = targetApp ? draft.studies.find(s => s.id === targetApp.studyId) : undefined;
        if (!targetApp || !targetStudy || targetApp.status === "수락됨") return;

        targetApp.status = "수락됨";
        targetApp.decidedAt = nowText();
        targetStudy.current = Math.min(targetStudy.current + 1, targetStudy.capacity);
        if (targetStudy.current >= targetStudy.capacity) {
          targetStudy.status = "모집 마감";
        }

        draft.events.unshift({
          message: `${targetApp.applicantName}님의 ${targetApp.studyTitle} 신청이 수락되었습니다.`,
          createdAt: nowText()
        });
      });
      setNotice("신청을 수락했습니다. API 연결 실패 시 로컬 상태로 처리됩니다.");
    };

    const handleReject = async (appId: number) => {
      try {
        await updateApplicationStatusApi(appId, "거절됨");
        await syncFromApi();
        setNotice("API로 신청을 거절했습니다. apply-service가 상태 변경 알림을 발행했습니다.");
        return;
      } catch (error) {}

      updateState(draft => {
        const app = draft.applications.find(a => a.id === appId);
        if (!app) return;

        app.status = "거절됨";
        app.decidedAt = nowText();
        draft.events.unshift({
          message: `${app.applicantName}님의 ${app.studyTitle} 신청이 거절되었습니다.`,
          createdAt: nowText()
        });
      });
      setNotice("신청을 거절했습니다. API 연결 실패 시 로컬 상태로 처리됩니다.");
    };

    const handleCloseStudy = async (studyId: number) => {
      const source = state.studies.find(s => s.id === studyId);
      if (!source) return;

      try {
        await updateStudyApi({ ...source, status: "모집 마감" });
        await syncFromApi();
        setNotice("API로 스터디 모집 상태가 모집 마감으로 변경되었습니다.");
        return;
      } catch (error) {}

      updateState(draft => {
        const study = draft.studies.find(s => s.id === studyId);
        if (!study) return;

        study.status = "모집 마감";
        draft.events.unshift({
          message: `${study.title} 모집이 마감되었습니다.`,
          createdAt: nowText()
        });
      });
      setNotice("스터디 모집 상태가 모집 마감으로 변경되었습니다. API 연결 실패 시 로컬 상태로 처리됩니다.");
    };

    const handleReopenStudy = async (studyId: number) => {
      const study = state.studies.find(s => s.id === studyId);
      if (!study) return;
      if (study.current >= study.capacity) {
        setNotice("현재 인원이 모집 인원과 같아 모집중으로 변경할 수 없습니다. 모집 인원을 먼저 늘려주세요.");
        return;
      }

      try {
        await updateStudyApi({ ...study, status: "모집 중" });
        await syncFromApi();
        setNotice("API로 스터디 모집 상태가 모집 중으로 변경되었습니다.");
        return;
      } catch (error) {}

      updateState(draft => {
        const target = draft.studies.find(s => s.id === studyId);
        if (!target) return;
        target.status = "모집 중";
        draft.events.unshift({
          message: `${target.title} 모집이 다시 시작되었습니다.`,
          createdAt: nowText()
        });
      });
      setNotice("스터디 모집 상태가 모집 중으로 변경되었습니다. API 연결 실패 시 로컬 상태로 처리됩니다.");
    };

    const handleDeleteStudy = async (studyId: number) => {
      if (!confirm("정말 이 스터디를 삭제하시겠습니까?")) return;
      try {
        await deleteStudyApi(studyId);
        await syncFromApi();
        setNotice("API와 DB에서 스터디가 삭제되었습니다.");
        return;
      } catch (error) {}

      updateState(draft => {
        draft.studies = draft.studies.filter(s => s.id !== studyId);
        draft.applications = draft.applications.filter(app => app.studyId !== studyId);
        delete draft.comments[studyId.toString()];
      });
    };

    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">신청 관리</h1>
              <p className="text-muted-foreground">내가 등록한 스터디의 신청자와 문의를 관리합니다.</p>
            </div>
            <Link href="/create">
              <Button>새 스터디 등록</Button>
            </Link>
          </div>

          {notice && (
            <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              {notice}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-card border border-border p-6 rounded-xl text-center">
              <div className="text-sm text-muted-foreground mb-1">대기 신청</div>
              <div className="text-3xl font-bold text-blue-600">{pendingApps.length}</div>
            </div>
            <div className="bg-card border border-border p-6 rounded-xl text-center">
              <div className="text-sm text-muted-foreground mb-1">수락 완료</div>
              <div className="text-3xl font-bold text-emerald-600">{acceptedApps.length}</div>
            </div>
            <div className="bg-card border border-border p-6 rounded-xl text-center">
              <div className="text-sm text-muted-foreground mb-1">전체 문의</div>
              <div className="text-3xl font-bold text-primary">{hostComments.length}</div>
            </div>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-bold mb-4">받은 신청 목록</h2>
              {applicationsToMe.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl text-muted-foreground">
                  아직 받은 신청이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {applicationsToMe.map(app => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={app.id}
                      className="bg-card border border-border p-5 rounded-xl flex flex-col xl:flex-row justify-between items-start gap-4 shadow-sm hover-elevate transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-bold text-lg">{app.applicantName}</span>
                          <span className="text-sm text-muted-foreground">님이</span>
                          <Link href={`/studies/${app.studyId}`} className="text-sm font-medium text-primary hover:underline">
                            {app.studyTitle}
                          </Link>
                          <span className="text-sm text-muted-foreground">에 신청했습니다.</span>
                        </div>
                        <p className="text-muted-foreground bg-muted/30 p-3 rounded-md text-sm mb-3 border border-border/50">
                          "{app.message}"
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <span>신청일: {app.createdAt}</span>
                          <span>가능 시간: {app.availableTime}</span>
                          <span>학습 수준: {app.level}</span>
                        </div>
                      </div>

                      <div className="flex flex-row xl:flex-col items-center gap-2 w-full xl:w-auto">
                        {app.status === "신청 완료" || app.status === "검토 중" ? (
                          <>
                            <Button size="sm" className="w-full xl:w-24 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAccept(app.id)}>
                              수락
                            </Button>
                            <Button size="sm" variant="outline" className="w-full xl:w-24 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleReject(app.id)}>
                              거절
                            </Button>
                          </>
                        ) : app.status === "수락됨" ? (
                          <Badge variant="outline" className={`w-full xl:w-24 justify-center py-1.5 ${statusClass(app.status)}`}>
                            {app.status}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={`w-full xl:w-24 justify-center py-1.5 ${statusClass(app.status)}`}>
                            {app.status}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">내 스터디 관리</h2>
              {myStudies.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl text-muted-foreground">
                  등록한 스터디가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myStudies.map(study => {
                    const studyStatus = statusFor(study);
                    return (
                      <div key={study.id} className="bg-card border border-border p-5 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <Link href={`/studies/${study.id}`} className="font-bold text-lg hover:text-primary transition-colors">
                            {study.title}
                          </Link>
                          <Badge variant="outline" className={studyStatus === "모집 마감" ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}>
                            {studyStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{study.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                          <span className="rounded-full bg-muted px-2 py-1">{study.current} / {study.capacity}명</span>
                          <span className="rounded-full bg-muted px-2 py-1">마감 {study.deadline}</span>
                          <span className="rounded-full bg-muted px-2 py-1">{study.mode}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link href={`/studies/${study.id}/edit`}>
                            <Button variant="outline" size="sm" className="w-full gap-1">
                              <PencilLine className="w-4 h-4" /> 수정
                            </Button>
                          </Link>
                          {studyStatus === "모집 마감" ? (
                            <Button variant="outline" size="sm" className="gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50" onClick={() => handleReopenStudy(study.id)}>
                              <LockOpen className="w-4 h-4" /> 모집 중
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleCloseStudy(study.id)}>
                              모집 마감
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteStudy(study.id)}>
                            <Trash2 className="w-4 h-4" /> 삭제
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">최근 댓글 문의</h2>
              {hostComments.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl text-muted-foreground">
                  아직 문의 댓글이 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hostComments.slice(0, 6).map(comment => {
                    const writer = state.users.find(user => user.userId === comment.authorId);
                    return (
                      <div key={comment.id} className="bg-card border border-border p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <MessageCircle className="h-4 w-4 text-primary" />
                          <span className="font-medium">{writer?.name || comment.authorId}</span>
                          <span className="text-muted-foreground">· {comment.studyTitle}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{comment.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </Layout>
    );
  }

  const myApps = state.applications.filter(a => a.applicantId === userId);
  const canceledApps = myApps.filter(a => a.status === "취소됨");
  const visibleApps = showCanceledApps ? myApps : myApps.filter(a => a.status !== "취소됨");
  const myCommentsCount = Object.values(state.comments).flat().filter(c => c.authorId === userId).length;
  const pendingApps = myApps.filter(a => a.status === "신청 완료" || a.status === "검토 중");
  const acceptedApps = myApps.filter(a => a.status === "수락됨");

  const handleCancel = async (appId: number) => {
    const sourceApp = state.applications.find(item => item.id === appId);
    const sourceStudy = sourceApp ? state.studies.find(study => study.id === sourceApp.studyId) : undefined;

    try {
      await updateApplicationStatusApi(appId, "취소됨");
      if (sourceApp?.status === "수락됨" && sourceStudy) {
        await updateStudyApi({
          ...sourceStudy,
          current: Math.max(1, sourceStudy.current - 1),
          status: sourceStudy.current - 1 < sourceStudy.capacity ? "모집 중" : sourceStudy.status
        });
      }
      await syncFromApi();
      setNotice("API로 신청이 취소됨으로 변경되었습니다. apply-service가 상태 변경 이벤트를 발행했습니다.");
      return;
    } catch (error) {}

    updateState(draft => {
      const app = draft.applications.find(item => item.id === appId);
      if (!app) return;
      if (app.status === "취소됨") return;

      const wasAccepted = app.status === "수락됨";
      app.status = "취소됨";
      app.decidedAt = nowText();

      if (wasAccepted) {
        const study = draft.studies.find(s => s.id === app.studyId);
        if (study) {
          study.current = Math.max(1, study.current - 1);
          if (study.current < study.capacity) {
            study.status = "모집 중";
          }
        }
      }

      draft.events.unshift({
        message: wasAccepted ? `${app.studyTitle} 참여가 취소되어 모집 가능 인원이 생겼습니다.` : `${app.studyTitle} 신청이 취소되었습니다.`,
        createdAt: nowText()
      });
    });
    setNotice("신청이 취소됨으로 변경되었습니다. API 연결 실패 시 로컬 상태로 처리됩니다.");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">신청 내역</h1>

        {notice && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-card border border-border p-6 rounded-xl text-center">
            <div className="text-sm text-muted-foreground mb-1">대기 중</div>
            <div className="text-3xl font-bold text-blue-600">{pendingApps.length}</div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl text-center">
            <div className="text-sm text-muted-foreground mb-1">수락 완료</div>
            <div className="text-3xl font-bold text-emerald-600">{acceptedApps.length}</div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl text-center">
            <div className="text-sm text-muted-foreground mb-1">내가 쓴 댓글</div>
            <div className="text-3xl font-bold text-primary">{myCommentsCount}</div>
          </div>
        </div>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">내 신청 목록</h2>
              <p className="text-sm text-muted-foreground">기본 목록에서는 취소된 신청을 숨겨 진행 중인 신청을 먼저 보여줍니다.</p>
            </div>
            {canceledApps.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowCanceledApps(value => !value)}>
                {showCanceledApps ? "취소 내역 숨기기" : `취소 내역 보기 ${canceledApps.length}건`}
              </Button>
            )}
          </div>
          {myApps.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 border border-dashed rounded-xl">
              <div className="text-muted-foreground mb-4">아직 신청한 스터디가 없습니다.</div>
              <Link href="/studies">
                <Button>스터디 찾아보기</Button>
              </Link>
            </div>
          ) : visibleApps.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 border border-dashed rounded-xl">
              <div className="text-muted-foreground mb-4">진행 중인 신청 내역이 없습니다.</div>
              <Button variant="outline" onClick={() => setShowCanceledApps(true)}>취소 내역 보기</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleApps.map(app => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={app.id}
                  className="bg-card border border-border p-5 rounded-xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <Link href={`/studies/${app.studyId}`} className="font-bold text-lg hover:text-primary transition-colors">
                        {app.studyTitle}
                      </Link>
                      <Badge variant="outline" className={statusClass(app.status)}>
                        {app.status === "신청 완료" || app.status === "검토 중" ? <Clock className="w-3 h-3 mr-1" /> : null}
                        {app.status === "수락됨" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
                        {app.status === "거절됨" || app.status === "취소됨" ? <XCircle className="w-3 h-3 mr-1" /> : null}
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">신청 메시지: "{app.message}"</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                      <span>신청일: {app.createdAt}</span>
                      <span>가능 시간: {app.availableTime}</span>
                      <span>학습 수준: {app.level}</span>
                      {app.decidedAt && <span>처리일: {app.decidedAt}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full xl:w-auto">
                    {(app.status === "신청 완료" || app.status === "검토 중" || app.status === "수락됨") && (
                      <Button variant="outline" size="sm" className="flex-1 xl:flex-none text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleCancel(app.id)}>
                        {app.status === "수락됨" ? "참여 취소" : "신청 취소"}
                      </Button>
                    )}
                    <Link href={`/studies/${app.studyId}`} className="flex-1 xl:flex-none">
                      <Button variant="outline" size="sm" className="w-full">스터디 보기</Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
