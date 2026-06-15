import { useMemo, useRef, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, BellRing, Database, GitBranch, MessageSquare, Network, Radio, Send, Server } from "lucide-react";

type ApiResult = {
  title: string;
  status: "대기" | "성공" | "실패" | "수신";
  detail: string;
  body?: unknown;
};

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

export default function MsaDemo() {
  const defaultGateway = useMemo(() => {
    if (window.location.port === "3000" || window.location.port === "80") return "";
    return "http://localhost:8080";
  }, []);
  const [gatewayBase, setGatewayBase] = useState(defaultGateway);
  const [results, setResults] = useState<ApiResult[]>([
    {
      title: "시연 준비",
      status: "대기",
      detail: "Docker Compose로 서비스가 실행된 상태에서 아래 버튼을 누르면 Gateway, MySQL, RabbitMQ, Flux, RestTemplate, OpenFeign 연결을 확인합니다."
    }
  ]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const apiUrl = (path: string) => `${gatewayBase.replace(/\/$/, "")}${path}`;

  const pushResult = (result: ApiResult) => {
    setResults(prev => [result, ...prev].slice(0, 12));
  };

  const request = async (title: string, path: string, init?: RequestInit) => {
    try {
      const response = await fetch(apiUrl(path), {
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        ...init
      });
      const text = await response.text();
      const body = text ? JSON.parse(text) : null;
      pushResult({
        title,
        status: response.ok ? "성공" : "실패",
        detail: `${init?.method || "GET"} ${path} -> HTTP ${response.status}`,
        body
      });
      return body;
    } catch (error) {
      pushResult({
        title,
        status: "실패",
        detail: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  };

  const createStudy = () => request("스터디 모집글 등록", "/api/studies", {
    method: "POST",
    body: JSON.stringify({
      title: "API Gateway 실습 스터디",
      field: "전공 공부",
      recruiterName: "강현구",
      capacity: 5,
      currentCount: 1,
      mode: "온라인",
      status: "모집 중",
      level: "초급",
      description: "Gateway, Docker, MySQL, RabbitMQ를 직접 확인하는 실습용 스터디입니다.",
      deadline: "2026-06-20"
    })
  });

  const createComment = () => request("댓글/문의 등록", "/api/comments", {
    method: "POST",
    body: JSON.stringify({
      studyId: 1,
      authorName: "강현구",
      content: "댓글 서비스가 MySQL에 저장되는지 확인합니다."
    })
  });

  const createApplication = () => request("스터디 신청 + RabbitMQ 발행", "/api/applications", {
    method: "POST",
    body: JSON.stringify({
      studyId: 1,
      studyTitle: "정보처리기사 실기 스터디",
      applicantName: "강현구",
      message: "신청 이벤트가 RabbitMQ Queue로 발행되는지 확인합니다.",
      availableTime: "화/목 오후 8시",
      level: "초급"
    })
  });

  const openFlux = () => {
    eventSourceRef.current?.close();
    const source = new EventSource(apiUrl("/notifications/flux"));
    eventSourceRef.current = source;
    pushResult({
      title: "Flux 스트림 연결",
      status: "수신",
      detail: "GET /notifications/flux 연결됨. 신청 버튼을 누르면 이벤트가 추가로 들어옵니다."
    });
    const handleFluxMessage = (event: MessageEvent) => {
      const body = JSON.parse(event.data);
      pushResult({
        title: "Flux 알림 수신",
        status: "수신",
        detail: "notification-service WebFlux SSE 이벤트",
        body
      });
    };
    source.onmessage = handleFluxMessage;
    source.addEventListener("notification", event => handleFluxMessage(event as MessageEvent));
    source.onerror = () => {
      if (eventSourceRef.current !== source || source.readyState !== EventSource.CLOSED) return;
      pushResult({
        title: "Flux 스트림 오류",
        status: "실패",
        detail: "Flux 연결이 종료되었습니다. 다시 연결 버튼을 눌러 상태를 확인하세요."
      });
      eventSourceRef.current = null;
    };
  };

  const closeFlux = () => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    pushResult({
      title: "Flux 스트림 종료",
      status: "대기",
      detail: "EventSource 연결을 닫았습니다."
    });
  };

  const buttons = [
    { label: "Gateway 스터디 조회", icon: Network, run: () => request("Gateway -> study-service 조회", "/api/studies") },
    { label: "모집글 등록", icon: Database, run: createStudy },
    { label: "댓글 등록", icon: MessageSquare, run: createComment },
    { label: "스터디 신청", icon: Send, run: createApplication },
    { label: "알림 목록", icon: BellRing, run: () => request("notification-service 알림 조회", "/api/notifications") },
    { label: "RestTemplate", icon: Server, run: () => request("RestTemplate Study API 호출", "/client/resttemplate/studies") },
    { label: "OpenFeign", icon: GitBranch, run: () => request("OpenFeign Study API 호출", "/client/openfeign/studies") },
    { label: "Flux 연결", icon: Radio, run: openFlux },
  ];

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">MSA API 시연</h1>
          <p className="max-w-3xl text-muted-foreground">
            Docker Compose로 Spring Boot 서비스들을 실행한 뒤, Gateway, MySQL, RabbitMQ, Flux, RestTemplate, OpenFeign 연결을 버튼으로 확인하는 시연 화면입니다.
          </p>
        </div>

        <section className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Gateway 주소</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={gatewayBase} onChange={(event) => setGatewayBase(event.target.value)} placeholder="http://localhost:8080 또는 빈 값" />
            <Button variant="outline" onClick={() => setGatewayBase("")}>same-origin</Button>
            <Button variant="outline" onClick={() => setGatewayBase("http://localhost:8080")}>localhost:8080</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Docker Nginx 프론트는 빈 값으로 두면 `/api`, `/client`, `/notifications`가 Gateway로 프록시됩니다. Vite 개발 서버에서는 `http://localhost:8080`을 사용하세요.
          </p>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {buttons.map(item => (
            <Button key={item.label} variant="outline" className="h-14 justify-start gap-2" onClick={item.run}>
              <item.icon className="h-4 w-4 text-primary" />
              {item.label}
            </Button>
          ))}
          <Button variant="outline" className="h-14 justify-start gap-2 text-destructive hover:text-destructive" onClick={closeFlux}>
            <Radio className="h-4 w-4" />
            Flux 종료
          </Button>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">호출 결과</h2>
            <Badge variant="outline">최근 {results.length}개</Badge>
          </div>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={`${result.title}-${index}`} className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{result.title}</span>
                  <Badge
                    variant="outline"
                    className={
                      result.status === "성공" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600" :
                      result.status === "실패" ? "border-destructive/20 bg-destructive/10 text-destructive" :
                      result.status === "수신" ? "border-blue-500/20 bg-blue-500/10 text-blue-600" :
                      "bg-background"
                    }
                  >
                    {result.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{result.detail}</span>
                </div>
                {result.body !== undefined && (
                  <pre className="max-h-72 overflow-auto rounded-lg bg-background p-3 text-xs text-foreground">
                    {pretty(result.body)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
