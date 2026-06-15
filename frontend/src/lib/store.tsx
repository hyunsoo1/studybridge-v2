import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loadStudyBridgeSnapshot } from "@/lib/api";

export type User = {
  userId: string;
  password: string;
  name: string;
  nickname: string;
  email: string;
  university: string;
  major: string;
  interestCategory: string;
  role: "student" | "host";
  createdAt: string;
};

export type StudyStatus = "모집 중" | "모집 마감";
export type StudyMode = "온라인" | "오프라인" | "온·오프라인 병행";

export const STUDY_CATEGORIES = ["전공 공부", "자격증", "어학", "취업 준비", "코딩", "공모전", "독서", "발표 준비", "면접 준비"];
export const STUDY_LEVELS = ["입문", "초급", "중급", "고급", "자율"];

export type Study = {
  id: number;
  title: string;
  field: string;
  recruiterId: string;
  recruiterName: string;
  capacity: number;
  current: number;
  mode: StudyMode;
  status: StudyStatus;
  level: string;
  schedule: string;
  period: string;
  deadline: string;
  location: string;
  description: string;
  purpose: string;
  requirements: string[];
  materials: string[];
  goals: string[];
  tags: string[];
};

export type Comment = {
  id: number;
  authorId: string;
  content: string;
  createdAt: string;
  parentCommentId?: number;
};

export type ApplicationStatus = "신청 완료" | "검토 중" | "수락됨" | "거절됨" | "취소됨";

export type Application = {
  id: number;
  applicantId: string;
  applicantName: string;
  studyId: number;
  studyTitle: string;
  message: string;
  availableTime: string;
  level: string;
  status: ApplicationStatus;
  createdAt: string;
  decidedAt: string;
};

export type Event = { message: string; createdAt: string; readAt?: string };

export type AppState = {
  currentUserId: string;
  users: User[];
  studies: Study[];
  comments: Record<string, Comment[]>;
  applications: Application[];
  events: Event[];
};

const seedState: AppState = {
  currentUserId: "",
  users: [
    {
      userId: "younggu09",
      name: "강현구",
      nickname: "현구",
      password: "1234",
      email: "younggu09@studybridge.kr",
      university: "한국대학교",
      major: "컴퓨터공학과",
      interestCategory: "자격증",
      role: "student",
      createdAt: "2026-06-07 09:00"
    },
    {
      userId: "host01",
      name: "이서연",
      nickname: "서연",
      password: "1234",
      email: "host01@studybridge.kr",
      university: "서울대학교",
      major: "소프트웨어학부",
      interestCategory: "코딩",
      role: "host",
      createdAt: "2026-06-07 09:10"
    },
    {
      userId: "student02",
      name: "박지훈",
      nickname: "지훈",
      password: "1234",
      email: "student02@studybridge.kr",
      university: "연세대학교",
      major: "경영학과",
      interestCategory: "취업 준비",
      role: "student",
      createdAt: "2026-06-07 09:20"
    }
  ],
  studies: [
    {
      id: 1,
      title: "정보처리기사 실기 스터디",
      field: "자격증",
      recruiterId: "host01",
      recruiterName: "이서연",
      capacity: 4,
      current: 2,
      mode: "온라인",
      status: "모집 중",
      level: "초급",
      schedule: "매주 화요일, 목요일 오후 8시",
      period: "2026-06-16 ~ 2026-08-20",
      deadline: "2026-06-14",
      location: "Zoom, Notion 자료 공유",
      description: "정보처리기사 실기 기출문제를 함께 풀고 리뷰하는 스터디입니다.",
      purpose: "기출 풀이와 오답 리뷰를 반복하면서 시험 전까지 핵심 개념을 함께 정리합니다.",
      requirements: ["매주 2회 이상 참여 가능", "기본 개념을 한 번 이상 공부한 사람", "과제 제출 가능", "단체 채팅방 참여 가능"],
      materials: ["기출문제집", "Notion 계정", "Zoom 참여 환경"],
      goals: ["기출문제 풀이", "오답 리뷰", "개념 정리", "시험 직전 체크리스트"],
      tags: ["정보처리기사", "자격증", "온라인", "기출"]
    },
    {
      id: 2,
      title: "토익 850점 목표 아침 스터디",
      field: "어학",
      recruiterId: "host01",
      recruiterName: "이서연",
      capacity: 6,
      current: 3,
      mode: "온·오프라인 병행",
      status: "모집 중",
      level: "중급",
      schedule: "평일 오전 7시 30분",
      period: "2026-06-17 ~ 2026-07-31",
      deadline: "2026-06-15",
      location: "온라인 출석, 금요일 중앙도서관",
      description: "LC 쉐도잉과 RC 시간 단축 훈련을 매일 짧고 꾸준하게 진행합니다.",
      purpose: "방학 전까지 토익 루틴을 고정하고 목표 점수 850점을 함께 달성합니다.",
      requirements: ["주 4회 이상 출석 가능", "단어 테스트 참여", "모의고사 오답 공유 가능"],
      materials: ["ETS 기출", "단어장", "타이머"],
      goals: ["LC 쉐도잉", "RC 파트5 훈련", "주간 모의고사", "오답 노트"],
      tags: ["토익", "어학", "아침", "온오프라인"]
    },
    {
      id: 3,
      title: "코딩테스트 기본기 스터디",
      field: "코딩",
      recruiterId: "host01",
      recruiterName: "이서연",
      capacity: 5,
      current: 4,
      mode: "온라인",
      status: "모집 중",
      level: "입문",
      schedule: "매주 월요일, 수요일 오후 9시",
      period: "2026-06-18 ~ 2026-08-07",
      deadline: "2026-06-16",
      location: "Discord, GitHub",
      description: "알고리즘을 거의 처음 시작하는 대학생을 위한 코딩테스트 입문 스터디입니다.",
      purpose: "문제 풀이 습관을 만들고 배열, 문자열, BFS/DFS 기본 유형을 익힙니다.",
      requirements: ["Python 또는 JavaScript 기본 문법 이해", "주 3문제 풀이 가능", "풀이 설명 참여 가능"],
      materials: ["백준/프로그래머스 계정", "GitHub 계정"],
      goals: ["기초 문법 복습", "유형별 문제 풀이", "풀이 발표", "코드 리뷰"],
      tags: ["코딩테스트", "알고리즘", "입문", "온라인"]
    },
    {
      id: 4,
      title: "공모전 기획서 작성 스터디",
      field: "공모전",
      recruiterId: "student02",
      recruiterName: "박지훈",
      capacity: 4,
      current: 4,
      mode: "오프라인",
      status: "모집 마감",
      level: "중급",
      schedule: "토요일 오후 2시",
      period: "2026-06-15 ~ 2026-07-20",
      deadline: "2026-06-10",
      location: "홍대입구 스터디룸",
      description: "공모전 아이디어 발굴부터 기획서 완성까지 함께 진행하는 스터디입니다.",
      purpose: "팀 단위 피드백으로 제출 가능한 수준의 기획서를 완성합니다.",
      requirements: ["오프라인 참석 가능", "자료 조사 역할 분담 가능", "피드백을 적극 반영할 사람"],
      materials: ["노트북", "기존 수상작 분석 자료"],
      goals: ["아이디어 발산", "시장 조사", "기획서 구조화", "발표 리허설"],
      tags: ["공모전", "기획", "오프라인", "마감"]
    }
  ],
  comments: {
    "1": [
      { id: 1, authorId: "younggu09", content: "기출문제를 한 번 정도만 풀어봤는데 참여 가능할까요?", createdAt: "2026-06-07 10:20" },
      { id: 2, authorId: "host01", parentCommentId: 1, content: "가능합니다. 첫 주차에는 자주 나오는 유형부터 같이 정리할 예정입니다.", createdAt: "2026-06-07 10:32" },
      { id: 3, authorId: "student02", content: "수업 녹화나 자료 공유도 되나요?", createdAt: "2026-06-07 10:45" }
    ],
    "2": [
      { id: 4, authorId: "younggu09", content: "출석 인증은 어떤 방식으로 진행하나요?", createdAt: "2026-06-07 12:10" }
    ]
  },
  applications: [
    {
      id: 1,
      applicantId: "student02",
      applicantName: "박지훈",
      studyId: 1,
      studyTitle: "정보처리기사 실기 스터디",
      message: "현재 기출문제를 한 번 정도 풀어봤고, 혼자보다 같이 리뷰하면서 공부하고 싶어서 신청합니다.",
      availableTime: "화/목 오후 8시 참여 가능",
      level: "초급",
      status: "신청 완료",
      createdAt: "2026-06-07 11:00",
      decidedAt: ""
    }
  ],
  events: [
    { message: "박지훈님이 정보처리기사 실기 스터디에 신청했습니다.", createdAt: "2026-06-07 11:00" },
    { message: "정보처리기사 실기 스터디 신청 상태가 신청 완료로 변경되었습니다.", createdAt: "2026-06-07 11:00" },
    { message: "이서연님이 정보처리기사 실기 스터디를 등록했습니다.", createdAt: "2026-06-07 09:40" }
  ]
};

export const statusFor = (study: Study): StudyStatus => {
  if (study.current >= study.capacity || study.status === "모집 마감") return "모집 마감";
  return "모집 중";
};

export const nowText = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const nextId = (collection: { id: number }[]) => {
  if (!collection.length) return 1;
  return Math.max(...collection.map(item => item.id)) + 1;
};

export const nextCommentId = (comments: Record<string, Comment[]>) => {
  let max = 0;
  for (const arr of Object.values(comments)) {
    for (const c of arr) {
      if (c.id > max) max = c.id;
    }
  }
  return max + 1;
};

type StoreContextType = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  updateState: (fn: (draft: AppState) => void) => void;
  syncFromApi: () => Promise<void>;
};

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = "studybridge-state-v10";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (err) {}
    return seedState;
  });

  const syncFromApi = useCallback(async () => {
    const snapshot = await loadStudyBridgeSnapshot();
    setState(prev => ({
      ...prev,
      studies: snapshot.studies.length ? snapshot.studies : prev.studies,
      comments: Object.keys(snapshot.comments).length ? snapshot.comments : prev.comments,
      applications: snapshot.applications.length ? snapshot.applications : prev.applications,
      events: snapshot.events.length ? snapshot.events : prev.events
    }));
  }, []);

  useEffect(() => {
    syncFromApi().catch(() => {
      // Docker MSA가 꺼져 있으면 기존 로컬 데모 데이터로 동작합니다.
    });
  }, [syncFromApi]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateState = (fn: (draft: AppState) => void) => {
    setState(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
  };

  return (
    <StoreContext.Provider value={{ state, setState, updateState, syncFromApi }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
