# 교수님 레포지터리 · 강의자료 반영표

이 문서는 수업시간에 사용한 교수님 GitHub 예제 ZIP과 강의자료를 StudyBridge v2 MSA 프로젝트에 어떻게 반영했는지 설명하는 발표용 근거 자료입니다.

## 실습환경 반영

| 실습환경 항목 | StudyBridge 반영 |
| --- | --- |
| Docker Desktop | `docker-compose.yml`, 각 서비스 `Dockerfile`, Docker Hub 이미지명 |
| Visual Studio Code | React 프론트 + Maven/Spring Boot 서비스별 폴더 구조, `docs/api.http` |
| HeidiSQL | MySQL 컨테이너 `localhost:3307`, DB `studybridge`, 테이블 `studies/comments/applications/notifications` |
| hub.docker.com | `kanghyeongu00/studybridge-서비스명:latest` 이미지 네이밍 |
| github.com | `KangHyeonGu09/studybridge-v2` 기준 README, ArgoCD repoURL, CI/CD workflow |

## 교수님 예제 레포 반영

| 교수님 레포 ZIP | 수업 예제 핵심 | StudyBridge 변환 | 반영 파일 |
| --- | --- | --- | --- |
| `book-api-main.zip` | Book CRUD, JPA, MySQL, Dockerfile, k8s | 스터디 모집글 CRUD | `study-service/`, `k8s/studybridge-all.yaml` |
| `order-main.zip` | 주문 처리, 서비스 간 호출, OpenFeign/WebClient | 스터디 신청 처리 | `apply-service/`, `client-service/` |
| `delivery-main.zip` | 주문 이후 배송 처리 | 신청 이후 알림 처리 | `notification-service/` |
| `rabbitmqserver-main.zip` | RabbitMQ 메시지 발행 | 신청 완료 이벤트 발행 | `apply-service/ApplyServiceApplication.java` |
| `rabbitmqclient-master.zip` | RabbitMQ 메시지 수신, 화면 확인 | 신청완료 알림 수신 및 Flux 스트림 | `notification-service/NotificationServiceApplication.java` |
| `resttemplateclient-main.zip` | RestTemplate API 호출 | Study API RestTemplate 호출 | `client-service`, `/client/resttemplate/studies` |
| `springcloud-main.zip` | Spring Cloud, Docker/K8s, DB 연결 | Gateway/서비스 라우팅, k8s 구조 | `gateway-service/`, `k8s/` |
| `msa-main.zip` | MSA 배포 구조, Kustomize 스타일 | 서비스 분리, Docker/K8s 발표 구조 | `docker-compose.yml`, `k8s/`, `argocd/` |
| `authserver-main.zip` | 인증 서버 확장 | Keycloak/JWT 확장 설명 | `advanced/keycloak-studybridge.md` |
| `loginserver-keycloak-main.zip` | Keycloak 로그인 | StudyBridge 로그인 확장안 | `advanced/keycloak-studybridge.md` |
| `kafkabasic-main.zip` | Kafka 기본 메시징 | CDC/분석 이벤트 확장 | `advanced/docker-compose.kafka-cdc.yml` |
| `inventory-service-cdc-main.zip` | CDC 이벤트 | MySQL applications 변경 감지 확장 | `advanced/saga-cdc-kafka.md` |
| `order-service-cdc-main.zip` | 주문 CDC | 신청 상태 변경 CDC 확장 | `advanced/saga-cdc-kafka.md` |
| `order-saga-main.zip` | Saga 보상 트랜잭션 | 신청 수락/정원/알림 보상 흐름 | `advanced/saga-cdc-kafka.md` |
| `SagaOrchestrator-main.zip` | Saga Orchestrator | 신청 처리 오케스트레이션 확장 | `advanced/saga-cdc-kafka.md` |

## 강의자료 반영

| 강의자료 | 핵심 내용 | StudyBridge 반영 |
| --- | --- | --- |
| `3-1강 Rest API.pdf` | REST API 설계 | `/api/studies`, `/api/comments`, `/api/applications`, `/api/notifications` |
| `7강 DevOps 개념 및 실습.pdf` | Docker, CI/CD, 이미지 빌드 | `docker-compose.yml`, 각 `Dockerfile`, `.github/workflows/ci-build-push.yaml` |
| `8강 MSA 커뮤니케이션.pdf` | 동기/비동기 통신 | RestTemplate/OpenFeign 동기 호출, RabbitMQ 비동기 알림 |
| `9강 API 게이트웨이.pdf` | Gateway 라우팅 | `gateway-service/src/main/resources/application.yml` |
| `11강 서비스 메시.pdf` | Istio Gateway/VirtualService | `k8s/istio-gateway.yaml` |
| `13강. PV-PVC.pdf` | PersistentVolumeClaim | `k8s/studybridge-all.yaml` MySQL/RabbitMQ PVC |
| `스프링 클라우드 실습.pdf` | Spring Cloud 기반 라우팅 | `gateway-service`, `client-service` |
| `클라우드 네이티브 개요.pdf` | Cloud Native 구성 원칙 | 서비스 분리, 컨테이너, k8s, ArgoCD 구조 |
| `클라우드 네이티브 실습.pdf` | 배포 실습 | Docker Compose, k8s NodePort, ArgoCD Application |
| `k8s.yaml` | Deployment/Service 기본 구조 | `k8s/studybridge-all.yaml`의 Deployment/Service 작성 방식 |

## 발표에서 강조할 문장

“교수님 예제의 book-api는 Study Service로, order는 Apply Service로, delivery와 rabbitmqclient는 Notification Service로 변환했습니다. 메인 StudyBridge 화면의 모집글·댓글·신청·알림 기능은 Gateway API를 통해 실제 Spring Boot 서비스와 MySQL에 연결됩니다. 신청 이벤트는 RabbitMQ로 비동기 처리하고, 저장 결과는 MySQL/HeidiSQL에서 확인합니다. RestTemplate과 OpenFeign으로 서비스 간 동기 호출도 비교할 수 있으며, Docker Compose와 k8s/PV-PVC/ArgoCD/Service Mesh 구조까지 강의자료 기준으로 포함했습니다.”
