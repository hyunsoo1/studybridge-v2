# StudyBridge v2 Frontend Patch

이 버전은 사용자가 업로드한 StudyBridge 프론트엔드 프로젝트를 기준으로 수정한 버전입니다.

## 반영 내용

- 스터디 모집글 수정 기능 추가
  - `/studies/:id/edit` 경로 추가
  - 제목, 분야, 모집 인원, 진행 방식, 장소, 일정, 소개, 목적, 조건, 준비물, 목표, 태그 수정 가능
  - 모집 상태를 `모집 중` / `모집 마감`으로 직접 수정 가능

- 모집 상태 관리 기능 추가
  - 내 스터디 관리 화면에서 `모집 마감` 처리 가능
  - 마감된 스터디를 다시 `모집중`으로 변경 가능
  - 현재 인원이 모집 인원과 같으면 모집중으로 열 수 없도록 안내

- 참여자 나감 처리 추가
  - 수락된 신청자를 `나감 처리`하면 신청 상태가 `취소됨`으로 바뀜
  - 스터디 현재 인원이 1명 감소
  - 여유 인원이 생기면 모집 상태가 자동으로 `모집 중`으로 변경
  - 신청자가 직접 `참여 취소`해도 현재 인원 조정

- 교수님 평가 기준 대응 화면 추가
  - `/architecture` 페이지 추가
  - 교수님 레포 예제(book-api, order, delivery, rabbitmq, resttemplate, openfeign)를 StudyBridge v2 기능으로 변환한 표 추가
  - Docker Hub/GitHub 계정 기준 설명 추가

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 출력된 Vite 주소로 접속합니다. 보통 `http://localhost:5173` 입니다.

## 빌드 확인

```bash
npm run build
```

현재 수정본은 `npm run build` 기준으로 빌드 성공 확인했습니다.

## 주의

이 프로젝트는 현재 프론트엔드 localStorage 기반 시연용입니다. 교수님 평가 기준의 MSA 최종본으로 가려면 이후 Spring Boot 서비스, Docker Compose, RabbitMQ, MySQL, Gateway와 연결하는 단계가 필요합니다.
