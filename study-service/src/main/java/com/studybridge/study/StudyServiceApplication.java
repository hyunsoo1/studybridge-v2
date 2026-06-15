package com.studybridge.study;

import jakarta.persistence.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@SpringBootApplication
public class StudyServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudyServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner seedStudies(StudyRepository repository) {
        return args -> {
            if (repository.count() > 0) {
                List<Study> studies = repository.findAll();
                studies.forEach(StudyServiceApplication::fillMissingFields);
                repository.saveAll(studies);
                return;
            }
            repository.save(new Study("정보처리기사 실기 스터디", "자격증", "host01", "이서연", 4, 2, "온라인", "모집 중", "초급", "매주 화요일, 목요일 오후 8시", "2026-06-16 ~ 2026-08-20", "Zoom, Notion 자료 공유", "정보처리기사 실기 기출문제를 함께 풀고 리뷰합니다.", "기출 풀이와 오답 리뷰를 반복하면서 핵심 개념을 함께 정리합니다.", "매주 2회 이상 참여 가능|기본 개념을 한 번 이상 공부한 사람|과제 제출 가능", "기출문제집|Notion 계정|Zoom 참여 환경", "기출문제 풀이|오답 리뷰|개념 정리", "정보처리기사|자격증|온라인|기출", "2026-06-14"));
            repository.save(new Study("토익 850점 목표 아침 스터디", "어학", "host01", "이서연", 6, 3, "온·오프라인 병행", "모집 중", "중급", "평일 오전 7시 30분", "2026-06-17 ~ 2026-07-31", "온라인 출석, 금요일 중앙도서관", "LC 쉐도잉과 RC 시간 단축 훈련을 매일 진행합니다.", "방학 전까지 토익 루틴을 고정하고 목표 점수 850점을 함께 달성합니다.", "주 4회 이상 출석 가능|단어 테스트 참여|모의고사 오답 공유 가능", "ETS 기출|단어장|타이머", "LC 쉐도잉|RC 파트5 훈련|주간 모의고사", "토익|어학|아침|온오프라인", "2026-06-15"));
            repository.save(new Study("공모전 기획서 작성 스터디", "공모전", "student02", "박지훈", 4, 4, "오프라인", "모집 마감", "중급", "토요일 오후 2시", "2026-06-15 ~ 2026-07-20", "홍대입구 스터디룸", "아이디어 발굴부터 제출용 기획서 완성까지 진행합니다.", "팀 단위 피드백으로 제출 가능한 수준의 기획서를 완성합니다.", "오프라인 참석 가능|자료 조사 역할 분담 가능|피드백을 적극 반영할 사람", "노트북|기존 수상작 분석 자료", "아이디어 발산|시장 조사|기획서 구조화", "공모전|기획|오프라인|마감", "2026-06-10"));
        };
    }

    private static void fillMissingFields(Study study) {
        if (isBlank(study.recruiterId)) {
            if ("박지훈".equals(study.recruiterName)) study.recruiterId = "student02";
            else if ("강현구".equals(study.recruiterName)) study.recruiterId = "younggu09";
            else study.recruiterId = "host01";
        }
        if (isBlank(study.schedule)) study.schedule = "일정 협의";
        if (isBlank(study.period)) study.period = "2026-06-16 ~ 2026-08-20";
        if (isBlank(study.location)) study.location = "오프라인".equals(study.mode) ? "스터디룸 협의" : "온라인 회의실";
        if (isBlank(study.purpose)) study.purpose = study.description;
        if (isBlank(study.requirements)) study.requirements = "성실한 참여|과제 제출 가능|단체 채팅방 참여 가능";
        if (isBlank(study.materials)) study.materials = "노트북|학습 자료|온라인 회의 환경";
        if (isBlank(study.goals)) study.goals = "개념 정리|실전 문제 풀이|피드백";
        if (isBlank(study.tags)) study.tags = study.field + "|" + study.mode + "|" + study.level;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

@Entity
@Table(name = "studies")
class Study {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public String title;
    public String field;
    public String recruiterId;
    public String recruiterName;
    public Integer capacity;
    public Integer currentCount;
    public String mode;
    public String status;
    public String level;
    public String schedule;
    public String period;
    public String location;
    @Column(length = 2000)
    public String description;
    @Column(length = 2000)
    public String purpose;
    @Column(length = 2000)
    public String requirements;
    @Column(length = 2000)
    public String materials;
    @Column(length = 2000)
    public String goals;
    @Column(length = 2000)
    public String tags;
    public String deadline;

    protected Study() {
    }

    Study(String title, String field, String recruiterId, String recruiterName, Integer capacity, Integer currentCount, String mode, String status, String level, String schedule, String period, String location, String description, String purpose, String requirements, String materials, String goals, String tags, String deadline) {
        this.title = title;
        this.field = field;
        this.recruiterId = recruiterId;
        this.recruiterName = recruiterName;
        this.capacity = capacity;
        this.currentCount = currentCount;
        this.mode = mode;
        this.status = status;
        this.level = level;
        this.schedule = schedule;
        this.period = period;
        this.location = location;
        this.description = description;
        this.purpose = purpose;
        this.requirements = requirements;
        this.materials = materials;
        this.goals = goals;
        this.tags = tags;
        this.deadline = deadline;
    }
}

interface StudyRepository extends JpaRepository<Study, Long> {
}

@RestController
@RequestMapping("/api/studies")
class StudyController {
    private final StudyRepository repository;

    StudyController(StudyRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    List<Study> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    ResponseEntity<Study> findOne(@PathVariable long id) {
        return repository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    Study create(@RequestBody Study study) {
        study.id = null;
        if (study.currentCount == null) study.currentCount = 1;
        if (study.status == null || study.status.isBlank()) study.status = "모집 중";
        if (study.recruiterId == null || study.recruiterId.isBlank()) study.recruiterId = "host01";
        return repository.save(study);
    }

    @PutMapping("/{id}")
    ResponseEntity<Study> update(@PathVariable long id, @RequestBody Study next) {
        return repository.findById(id).map(study -> {
            study.title = next.title;
            study.field = next.field;
            study.recruiterId = next.recruiterId;
            study.recruiterName = next.recruiterName;
            study.capacity = next.capacity;
            study.currentCount = next.currentCount;
            study.mode = next.mode;
            study.status = next.status;
            study.level = next.level;
            study.schedule = next.schedule;
            study.period = next.period;
            study.location = next.location;
            study.description = next.description;
            study.purpose = next.purpose;
            study.requirements = next.requirements;
            study.materials = next.materials;
            study.goals = next.goals;
            study.tags = next.tags;
            study.deadline = next.deadline;
            return ResponseEntity.ok(repository.save(study));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
