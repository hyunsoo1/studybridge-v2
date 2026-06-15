package com.studybridge.apply;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.*;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@SpringBootApplication
public class ApplyServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApplyServiceApplication.class, args);
    }

    @Bean
    MessageConverter jsonMessageConverter() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return new Jackson2JsonMessageConverter(mapper);
    }

    @Bean
    DirectExchange exchange(@Value("${studybridge.rabbit.exchange}") String exchange) {
        return new DirectExchange(exchange);
    }

    @Bean
    Queue queue(@Value("${studybridge.rabbit.queue}") String queue) {
        return QueueBuilder.durable(queue).build();
    }

    @Bean
    Binding binding(Queue queue, DirectExchange exchange, @Value("${studybridge.rabbit.routing-key}") String routingKey) {
        return BindingBuilder.bind(queue).to(exchange).with(routingKey);
    }
}

@Entity
@Table(name = "applications")
class StudyApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public Long studyId;
    public String studyTitle;
    public String applicantId;
    public String applicantName;
    @Column(length = 2000)
    public String message;
    public String availableTime;
    public String level;
    public String status;
    public LocalDateTime createdAt;
    public LocalDateTime decidedAt;

    protected StudyApplication() {
    }
}

class ApplicationEvent {
    public Long applicationId;
    public Long studyId;
    public String studyTitle;
    public String applicantName;
    public String status;
    public LocalDateTime createdAt;

    public ApplicationEvent() {
    }

    ApplicationEvent(Long applicationId, Long studyId, String studyTitle, String applicantName, String status, LocalDateTime createdAt) {
        this.applicationId = applicationId;
        this.studyId = studyId;
        this.studyTitle = studyTitle;
        this.applicantName = applicantName;
        this.status = status;
        this.createdAt = createdAt;
    }
}

interface ApplicationRepository extends JpaRepository<StudyApplication, Long> {
    List<StudyApplication> findByStudyIdOrderByIdDesc(Long studyId);
    List<StudyApplication> findByApplicantIdOrderByIdDesc(String applicantId);
    List<StudyApplication> findByApplicantNameOrderByIdDesc(String applicantName);
}

@RestController
@RequestMapping("/api/applications")
class ApplicationController {
    private final ApplicationRepository repository;
    private final RabbitTemplate rabbitTemplate;
    private final String exchange;
    private final String routingKey;

    ApplicationController(ApplicationRepository repository, RabbitTemplate rabbitTemplate,
                          @Value("${studybridge.rabbit.exchange}") String exchange,
                          @Value("${studybridge.rabbit.routing-key}") String routingKey) {
        this.repository = repository;
        this.rabbitTemplate = rabbitTemplate;
        this.exchange = exchange;
        this.routingKey = routingKey;
    }

    @GetMapping
    List<StudyApplication> findAll() {
        return repository.findAll();
    }

    @GetMapping("/study/{studyId}")
    List<StudyApplication> byStudy(@PathVariable long studyId) {
        return repository.findByStudyIdOrderByIdDesc(studyId);
    }

    @GetMapping("/applicant/{applicantName}")
    List<StudyApplication> byApplicant(@PathVariable String applicantName) {
        return repository.findByApplicantNameOrderByIdDesc(applicantName);
    }

    @GetMapping("/applicant-id/{applicantId}")
    List<StudyApplication> byApplicantId(@PathVariable String applicantId) {
        return repository.findByApplicantIdOrderByIdDesc(applicantId);
    }

    @PostMapping
    StudyApplication create(@RequestBody StudyApplication application) {
        application.id = null;
        application.status = "신청 완료";
        application.createdAt = LocalDateTime.now();
        StudyApplication saved = repository.save(application);
        publish(saved);
        return saved;
    }

    @PutMapping("/{id}/status")
    ResponseEntity<StudyApplication> updateStatus(@PathVariable long id, @RequestParam String status) {
        return repository.findById(id).map(application -> {
            application.status = status;
            application.decidedAt = LocalDateTime.now();
            StudyApplication saved = repository.save(application);
            publish(saved);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    private void publish(StudyApplication application) {
        rabbitTemplate.convertAndSend(exchange, routingKey,
                new ApplicationEvent(application.id, application.studyId, application.studyTitle, application.applicantName, application.status, LocalDateTime.now()));
    }
}
