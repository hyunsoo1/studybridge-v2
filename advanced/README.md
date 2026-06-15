# Advanced semester technologies

이 폴더는 발표에서 “확장 구조로 학습 내용을 반영했다”고 설명하기 위한 자료입니다.

- `docker-compose.kafka-cdc.yml`: Kafka + Debezium CDC 구조. MySQL `applications` 변경을 Kafka topic으로 내보내는 확장안입니다.
- Keycloak: `authserver-main.zip`, `loginserver-keycloak-main.zip` 예제를 참고해 Gateway 앞 인증 서버로 확장합니다.
- Saga: `order-saga-main.zip`, `SagaOrchestrator-main.zip` 예제를 참고해 신청 수락, 정원 증가, 알림 발송을 보상 트랜잭션으로 묶을 수 있습니다.
- Service Mesh: `k8s/istio-gateway.yaml`로 Istio Gateway와 VirtualService 구조를 포함했습니다.
- Observability: Kiali, Grafana, Prometheus는 Istio/Linkerd 설치 후 트래픽 시각화 용도로 설명합니다.
