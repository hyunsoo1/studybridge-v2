import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Boxes, CheckCircle2, Container, Database, GitBranch, MessageSquare, Network, Radio, Server, ShieldCheck, Terminal, Workflow } from "lucide-react";

const services = [
  { name: "frontend", role: "React UI", port: "3000", desc: "모집글 CRUD, 댓글, 신청, 신청내역, 알림 화면이 Gateway API와 연결" },
  { name: "gateway-service", role: "API Gateway", port: "8080", desc: "프론트 요청을 study, comment, apply, notification 서비스로 라우팅" },
  { name: "study-service", role: "Study CRUD", port: "8081", desc: "스터디 모집글 조회·등록·수정·삭제" },
  { name: "apply-service", role: "Apply", port: "8082", desc: "스터디 신청, 신청 상태 관리, RabbitMQ 메시지 발행" },
  { name: "comment-service", role: "Comment", port: "8083", desc: "스터디 상세 문의 댓글 등록·수정·삭제·조회" },
  { name: "client-service", role: "RestTemplate / OpenFeign", port: "8084", desc: "서비스 간 동기 호출 방식 비교 화면" },
  { name: "notification-service", role: "Notification", port: "8085", desc: "신청완료 메시지를 수신해 알림 이벤트로 처리" },
];

const professorMap = [
  ["book-api", "study-service", "도서 CRUD를 스터디 모집글 CRUD로 변환"],
  ["order", "apply-service", "주문 처리를 스터디 신청 처리로 변환"],
  ["delivery", "notification-service", "배송완료를 신청완료 알림으로 변환"],
  ["rabbitmqserver / rabbitmqclient", "RabbitMQ", "신청 메시지 발행과 Queue 확인"],
  ["resttemplateclient", "client-service", "RestTemplate으로 Study API 호출"],
  ["openfeignclient", "client-service", "OpenFeign으로 Study API 호출"],
  ["springcloud / msa", "gateway-service", "Spring Cloud Gateway와 MSA 라우팅 구조"],
];

const featureChecklist = [
  ["회원가입 / 로그인", "구현됨", "/signup, /login"],
  ["스터디 모집글 조회", "API 연동", "/api/studies"],
  ["스터디 모집글 등록", "API 연동", "POST /api/studies"],
  ["스터디 모집글 수정", "API 연동", "PUT /api/studies/:id"],
  ["스터디 모집글 삭제", "API 연동", "DELETE /api/studies/:id"],
  ["댓글/문의 등록·조회·수정·삭제", "API 연동", "/api/comments"],
  ["스터디 신청", "API 연동", "POST /api/applications"],
  ["신청 내역 조회 / 신청 취소", "API 연동", "/my + apply-service"],
  ["신청 수락·거절", "API 연동", "PUT /api/applications/:id/status"],
  ["신청완료 알림", "API 연동", "/api/notifications"],
  ["RabbitMQ Queue 확인", "구조 반영", "apply-service -> notification-service"],
  ["HeidiSQL DB 확인", "구조 반영", "users, studies, comments, applications, notifications"],
  ["RestTemplate 확인", "구조 반영", "client-service"],
  ["OpenFeign 확인", "구조 반영", "client-service"],
  ["WebFlux / Flux 실시간 신청 상태", "구조 반영", "/notifications/flux"],
];

const infraItems = [
  { icon: Container, title: "Docker Compose", value: "docker compose up --build", desc: "frontend, gateway, study, apply, comment, client, notification, mysql, rabbitmq를 한 번에 실행하는 기준입니다." },
  { icon: Database, title: "MySQL + HeidiSQL", value: "localhost:3307", desc: "users, studies, comments, applications, notifications 테이블 저장 결과를 HeidiSQL에서 확인합니다." },
  { icon: MessageSquare, title: "RabbitMQ Console", value: "localhost:15672", desc: "스터디 신청 이벤트가 Queue에 발행되고 notification-service가 수신하는 흐름을 확인합니다." },
  { icon: Radio, title: "Flux Stream", value: "/notifications/flux", desc: "신청 상태 변경 이벤트를 WebFlux 스트림으로 확인하는 발표 포인트입니다." },
  { icon: Workflow, title: "k8s / ArgoCD", value: "k8s/, argocd/", desc: "Docker Hub 이미지명으로 Deployment, Service, ArgoCD 앱 구조를 설명합니다." },
  { icon: Terminal, title: "서비스 간 호출", value: "RestTemplate / OpenFeign", desc: "client-service에서 study-service API를 두 방식으로 호출해 비교합니다." },
];

const dockerImages = [
  "kanghyeongu00/studybridge-frontend:latest",
  "kanghyeongu00/studybridge-gateway-service:latest",
  "kanghyeongu00/studybridge-study-service:latest",
  "kanghyeongu00/studybridge-apply-service:latest",
  "kanghyeongu00/studybridge-comment-service:latest",
  "kanghyeongu00/studybridge-client-service:latest",
  "kanghyeongu00/studybridge-notification-service:latest",
];

export default function Architecture() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="mb-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <Network className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold mb-2">StudyBridge v2 MSA 설계</h1>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            StudyBridge v2 MSA가 어떤 서비스로 나뉘고, 각 서비스가 Gateway, DB, 메시지 큐와 어떻게 연결되는지 한 화면에서 확인하는 구조 설명 페이지입니다.
          </p>
          <div className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-700">
            Docker Compose로 Spring Boot 서비스들을 띄운 뒤 Gateway, MySQL, RabbitMQ, Flux, RestTemplate, OpenFeign 연결을 시연합니다.
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <Server className="mb-3 h-6 w-6 text-primary" />
            <h2 className="font-bold mb-1">마이크로서비스 수</h2>
            <p className="text-sm text-muted-foreground">Gateway 포함 6개 서비스로 분리하여 평가 기준의 서비스 수 항목을 강화합니다.</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <MessageSquare className="mb-3 h-6 w-6 text-primary" />
            <h2 className="font-bold mb-1">비동기 통신</h2>
            <p className="text-sm text-muted-foreground">스터디 신청 이벤트를 RabbitMQ Queue로 발행하고 알림 서비스로 확장합니다.</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <GitBranch className="mb-3 h-6 w-6 text-primary" />
            <h2 className="font-bold mb-1">GitHub / Docker 기준</h2>
            <p className="text-sm text-muted-foreground">GitHub: KangHyeonGu09 / Docker Hub: kanghyeongu00 기준으로 배포 이미지를 설계합니다.</p>
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Boxes className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">서비스 구성</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map(service => (
              <div key={service.name} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-bold">{service.name}</h3>
                  <Badge variant="outline">{service.role}</Badge>
                </div>
                <div className="mb-2 text-xs font-medium text-primary">Port {service.port}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm mb-10">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">최종 핵심 기능 반영 현황</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {featureChecklist.map(([feature, status, target]) => (
              <div key={feature} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm">
                <span className="font-medium">{feature}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className={status === "구현됨" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"}>
                    {status}
                  </Badge>
                  <span className="hidden sm:inline text-xs text-muted-foreground">{target}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Container className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Docker · HeidiSQL · RabbitMQ · k8s 시연 기준</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {infraItems.map(item => (
              <div key={item.title} className="rounded-2xl border bg-card p-5 shadow-sm">
                <item.icon className="mb-3 h-5 w-5 text-primary" />
                <h3 className="font-bold mb-1">{item.title}</h3>
                <div className="mb-2 rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">{item.value}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm mb-10">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">GitHub / Docker Hub 이미지 기준</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="text-muted-foreground mb-1">GitHub</div>
                <div className="font-semibold">KangHyeonGu09 / studybridge-v2</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="text-muted-foreground mb-1">Docker Hub</div>
                <div className="font-semibold">kanghyeongu00</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dockerImages.map(image => (
                <div key={image} className="rounded-lg bg-muted px-3 py-2 font-mono text-xs text-foreground">
                  {image}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm mb-10">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">교수님 레포 변환 기준</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 pr-4">교수님 예제</th>
                  <th className="py-3 pr-4">StudyBridge v2</th>
                  <th className="py-3">변환 내용</th>
                </tr>
              </thead>
              <tbody>
                {professorMap.map(([source, target, desc]) => (
                  <tr key={source} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{source}</td>
                    <td className="py-3 pr-4 text-primary font-semibold">{target}</td>
                    <td className="py-3 text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/studies"><Button>스터디 기능 확인</Button></Link>
          <Link href="/msa-demo"><Button>API 시연 열기</Button></Link>
          <Link href="/my"><Button variant="outline">신청/모집 관리</Button></Link>
          <Link href="/activity"><Button variant="outline">알림 확인</Button></Link>
        </div>
      </div>
    </Layout>
  );
}
