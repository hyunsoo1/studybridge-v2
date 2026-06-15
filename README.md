# StudyBridge v2 MSA

교수님 수업 예제(book-api, order, delivery, rabbitmq, resttemplateclient, openfeignclient, springcloud/msa)를 그대로 복사하지 않고, 대학생 스터디 모집 플랫폼 도메인으로 변환한 기말 발표용 MSA 프로젝트입니다.

## 필수 기술 반영

- Spring Boot REST API: `study-service`, `comment-service`, `apply-service`, `notification-service`, `client-service`
- Spring Cloud Gateway: `gateway-service`
- Main React UI API 연동: `/studies`, `/create`, `/studies/:id`, `/my`, `/activity`가 Gateway API와 연결
- MySQL + HeidiSQL 확인: `mysql` 컨테이너, `localhost:3307`
- RabbitMQ: 신청 이벤트 발행/수신, 관리 콘솔 `http://localhost:15672`
- Docker Compose: `docker-compose.yml`
- Nginx Frontend: `frontend/Dockerfile`, `frontend/nginx.conf`
- RestTemplate: `GET /client/resttemplate/studies`
- OpenFeign: `GET /client/openfeign/studies`
- WebFlux / Flux: `GET /notifications/flux`
- k8s yaml / PV-PVC / ArgoCD / Istio 구조: `k8s/`, `argocd/`
- DevOps CI/CD 구조: `.github/workflows/ci-build-push.yaml`
- 확장 학습 기술: `advanced/`에 Keycloak, Kafka/CDC, Saga, Service Mesh 설명과 compose/yaml 포함

## 실행

```bash
docker compose up --build
```

접속 주소:

- Frontend: http://localhost:3000
- Gateway: http://localhost:8080
- RabbitMQ: http://localhost:15672 / `admin` / `admin123`
- HeidiSQL: host `127.0.0.1`, port `3307`, user `root`, password `root1234`, database `studybridge`
- 메인 StudyBridge 화면: http://localhost:3000/studies
- API 시연 화면: http://localhost:3000/msa-demo

## 교수님 예제 변환표

| 교수님 예제 | StudyBridge 변환 |
| --- | --- |
| book-api | `study-service`: 스터디 모집글 CRUD |
| order | `apply-service`: 스터디 신청 처리 |
| delivery | `notification-service`: 신청완료 알림 처리 |
| rabbitmqserver | `apply-service`: 신청 이벤트 RabbitMQ 발행 |
| rabbitmqclient | `notification-service`: RabbitMQ 수신 + Flux 알림 |
| resttemplateclient | `client-service`: RestTemplate 호출 |
| openfeignclient | `client-service`: OpenFeign 호출 |
| springcloud / msa | `gateway-service`, Docker Compose, k8s, ArgoCD |
| PV/PVC 강의 | `k8s/studybridge-all.yaml` MySQL/RabbitMQ PVC |
| 서비스 메시 강의 | `k8s/istio-gateway.yaml` |

## 시연 순서

1. `docker compose up --build`
2. `docker ps`로 `frontend`, `gateway-service`, `study-service`, `apply-service`, `comment-service`, `notification-service`, `client-service`, `mysql`, `rabbitmq` 확인
3. `http://localhost:3000/studies`에서 Gateway가 내려준 스터디 목록이 메인 화면에 표시되는지 확인
4. `http://localhost:3000/architecture`에서 교수님 레포/강의자료 변환표 확인
5. 메인 화면에서 모집글 등록, 상세 댓글, 스터디 신청, 신청 내역, 알림 읽음 처리가 API와 DB에 반영되는지 확인
6. `http://localhost:3000/msa-demo`에서 `Gateway 스터디 조회`, `모집글 등록`, `댓글 등록`, `스터디 신청`, `RestTemplate`, `OpenFeign`, `Flux 연결` 버튼 순서대로 클릭
7. `http://localhost:8080/api/studies`로 Gateway 라우팅 확인
8. `http://localhost:8080/client/resttemplate/studies` 확인
9. `http://localhost:8080/client/openfeign/studies` 확인
10. `http://localhost:8080/notifications/flux`를 열고 신청 이벤트 스트림 확인
11. RabbitMQ 콘솔에서 `studybridge.application.queue` 확인
12. HeidiSQL에서 `studies`, `comments`, `applications`, `notifications` 테이블 확인
13. `k8s/`, `argocd/`, `advanced/` 구조로 Kubernetes, PV/PVC, Service Mesh, Kafka/CDC, Saga, Keycloak 확장 설명
