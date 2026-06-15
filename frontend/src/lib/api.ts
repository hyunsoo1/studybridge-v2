import type { Application, ApplicationStatus, Comment, Event, Study, StudyMode, StudyStatus } from "@/lib/store";

type RemoteStudy = {
  id: number;
  title: string;
  field: string;
  recruiterId?: string;
  recruiterName: string;
  capacity: number;
  current?: number;
  currentCount?: number;
  mode: StudyMode;
  status: StudyStatus;
  level: string;
  schedule?: string;
  period?: string;
  deadline: string;
  location?: string;
  description: string;
  purpose?: string;
  requirements?: string | string[];
  materials?: string | string[];
  goals?: string | string[];
  tags?: string | string[];
};

type RemoteComment = {
  id: number;
  studyId: number;
  authorName: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

type RemoteApplication = {
  id: number;
  applicantId?: string;
  applicantName: string;
  studyId: number;
  studyTitle: string;
  message: string;
  availableTime: string;
  level: string;
  status: ApplicationStatus;
  createdAt?: string;
  decidedAt?: string;
};

type RemoteNotification = {
  id: number;
  message: string;
  createdAt?: string;
  readAt?: string;
};

export type StudyBridgeSnapshot = {
  studies: Study[];
  comments: Record<string, Comment[]>;
  applications: Application[];
  events: Event[];
};

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

const userIdByName: Record<string, string> = {
  "강현구": "younggu09",
  "이서연": "host01",
  "박지훈": "student02",
  Kang: "younggu09"
};

const apiUrl = (path: string) => `${API_BASE}${path}`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${init?.method || "GET"} ${path} failed: ${res.status} ${detail}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

const splitList = (value: string | string[] | undefined, fallback: string[]) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return fallback;
  const items = value
    .split(/\||\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
};

const joinList = (items: string[]) => items.join("|");

const formatDateTime = (value?: string) => {
  if (!value) return "";
  return value.replace("T", " ").slice(0, 16);
};

const inferRecruiterId = (study: RemoteStudy) => study.recruiterId || userIdByName[study.recruiterName] || "host01";
const inferApplicantId = (application: RemoteApplication) => application.applicantId || userIdByName[application.applicantName] || application.applicantName;

export const toRemoteStudy = (study: Study): RemoteStudy => ({
  id: study.id,
  title: study.title,
  field: study.field,
  recruiterId: study.recruiterId,
  recruiterName: study.recruiterName,
  capacity: study.capacity,
  currentCount: study.current,
  mode: study.mode,
  status: study.status,
  level: study.level,
  schedule: study.schedule,
  period: study.period,
  deadline: study.deadline,
  location: study.location,
  description: study.description,
  purpose: study.purpose,
  requirements: joinList(study.requirements),
  materials: joinList(study.materials),
  goals: joinList(study.goals),
  tags: joinList(study.tags)
});

export const toStudy = (study: RemoteStudy): Study => ({
  id: Number(study.id),
  title: study.title,
  field: study.field,
  recruiterId: inferRecruiterId(study),
  recruiterName: study.recruiterName,
  capacity: Number(study.capacity || 4),
  current: Number(study.current ?? study.currentCount ?? 1),
  mode: study.mode || "온라인",
  status: study.status || "모집 중",
  level: study.level || "초급",
  schedule: study.schedule || "일정 협의",
  period: study.period || "기간 협의",
  deadline: study.deadline || "2026-06-30",
  location: study.location || (study.mode === "오프라인" ? "스터디룸 협의" : "온라인"),
  description: study.description || "스터디 소개를 확인해주세요.",
  purpose: study.purpose || study.description || "함께 학습 목표를 달성합니다.",
  requirements: splitList(study.requirements, ["성실한 참여", "과제 제출 가능"]),
  materials: splitList(study.materials, ["노트북", "학습 자료"]),
  goals: splitList(study.goals, ["기초 개념 정리", "실전 문제 풀이", "피드백"]),
  tags: splitList(study.tags, [study.field, study.mode].filter(Boolean))
});

export const toComment = (comment: RemoteComment): Comment => ({
  id: Number(comment.id),
  authorId: userIdByName[comment.authorName] || comment.authorName || "younggu09",
  content: comment.content,
  createdAt: formatDateTime(comment.updatedAt || comment.createdAt) || "방금 전"
});

export const toApplication = (application: RemoteApplication): Application => ({
  id: Number(application.id),
  applicantId: inferApplicantId(application),
  applicantName: application.applicantName,
  studyId: Number(application.studyId),
  studyTitle: application.studyTitle,
  message: application.message,
  availableTime: application.availableTime,
  level: application.level,
  status: application.status,
  createdAt: formatDateTime(application.createdAt) || "방금 전",
  decidedAt: formatDateTime(application.decidedAt)
});

export const toEvent = (notification: RemoteNotification): Event => ({
  message: notification.message,
  createdAt: formatDateTime(notification.createdAt) || "방금 전",
  readAt: formatDateTime(notification.readAt) || undefined
});

export async function loadStudyBridgeSnapshot(): Promise<StudyBridgeSnapshot> {
  const studies = await request<RemoteStudy[]>("/api/studies");
  const [applications, notifications] = await Promise.all([
    request<RemoteApplication[]>("/api/applications").catch(() => []),
    request<RemoteNotification[]>("/api/notifications").catch(() => [])
  ]);

  const commentPairs = await Promise.all(
    studies.map(async study => {
      const comments = await request<RemoteComment[]>(`/api/comments/study/${study.id}`).catch(() => []);
      return [String(study.id), comments.map(toComment)] as const;
    })
  );

  return {
    studies: studies.map(toStudy),
    comments: Object.fromEntries(commentPairs),
    applications: applications.map(toApplication),
    events: notifications.map(toEvent)
  };
}

export const createStudyApi = (study: Study) => request<RemoteStudy>("/api/studies", {
  method: "POST",
  body: JSON.stringify(toRemoteStudy(study))
}).then(toStudy);

export const updateStudyApi = (study: Study) => request<RemoteStudy>(`/api/studies/${study.id}`, {
  method: "PUT",
  body: JSON.stringify(toRemoteStudy(study))
}).then(toStudy);

export const deleteStudyApi = (studyId: number) => request<void>(`/api/studies/${studyId}`, {
  method: "DELETE"
});

export const createCommentApi = (studyId: number, authorId: string, content: string) => request<RemoteComment>("/api/comments", {
  method: "POST",
  body: JSON.stringify({ studyId, authorName: authorId, content })
}).then(toComment);

export const updateCommentApi = (commentId: number, content: string) => request<RemoteComment>(`/api/comments/${commentId}`, {
  method: "PUT",
  body: JSON.stringify({ content })
}).then(toComment);

export const deleteCommentApi = (commentId: number) => request<void>(`/api/comments/${commentId}`, {
  method: "DELETE"
});

export const createApplicationApi = (application: Application) => request<RemoteApplication>("/api/applications", {
  method: "POST",
  body: JSON.stringify({
    studyId: application.studyId,
    studyTitle: application.studyTitle,
    applicantId: application.applicantId,
    applicantName: application.applicantName,
    message: application.message,
    availableTime: application.availableTime,
    level: application.level
  })
}).then(toApplication);

export const updateApplicationStatusApi = (applicationId: number, status: ApplicationStatus) => request<RemoteApplication>(
  `/api/applications/${applicationId}/status?status=${encodeURIComponent(status)}`,
  { method: "PUT" }
).then(toApplication);

export const markNotificationsReadApi = () => request<RemoteNotification[]>("/api/notifications/read-all", {
  method: "PUT"
}).then(notifications => notifications.map(toEvent));
