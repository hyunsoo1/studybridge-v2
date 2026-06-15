# Saga / CDC / Kafka 확장안

## Saga
신청 수락 흐름을 `apply-service -> study-service 정원 증가 -> notification-service 알림`으로 묶고, 중간 실패 시 신청 상태를 `검토 중`으로 되돌리는 보상 트랜잭션을 둡니다.

## CDC
MySQL `applications` 테이블 변경 이벤트를 Debezium이 읽어 Kafka topic으로 발행합니다.

## Kafka
RabbitMQ는 신청완료 알림 실시간 처리에 사용하고, Kafka는 신청/정원 변경 이력 분석이나 CDC 스트림에 사용한다는 역할 분리가 가능합니다.
