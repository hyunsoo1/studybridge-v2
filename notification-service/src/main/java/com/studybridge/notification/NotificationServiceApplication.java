package com.studybridge.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.*;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.LocalDateTime;
import java.util.List;

@SpringBootApplication
public class NotificationServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }

    @Bean
    Sinks.Many<NotificationDto> notificationSink() {
        return Sinks.many().multicast().onBackpressureBuffer();
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
@Table(name = "notifications")
class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public Long applicationId;
    public Long studyId;
    public String studyTitle;
    public String applicantName;
    public String status;
    @Column(length = 2000)
    public String message;
    public LocalDateTime createdAt;
    public LocalDateTime readAt;

    protected Notification() {
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
}

class NotificationDto {
    public Long id;
    public String message;
    public String status;
    public LocalDateTime createdAt;

    public NotificationDto() {
    }

    NotificationDto(Long id, String message, String status, LocalDateTime createdAt) {
        this.id = id;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
    }

    static NotificationDto from(Notification notification) {
        return new NotificationDto(notification.id, notification.message, notification.status, notification.createdAt);
    }
}

interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop20ByOrderByIdDesc();
}

@RestController
class NotificationController {
    private final NotificationRepository repository;
    private final Sinks.Many<NotificationDto> sink;

    NotificationController(NotificationRepository repository, Sinks.Many<NotificationDto> sink) {
        this.repository = repository;
        this.sink = sink;
    }

    @GetMapping("/api/notifications")
    List<Notification> findAll() {
        return repository.findTop20ByOrderByIdDesc();
    }

    @PutMapping("/api/notifications/read-all")
    List<Notification> readAll() {
        List<Notification> notifications = repository.findAll();
        LocalDateTime readAt = LocalDateTime.now();
        notifications.forEach(notification -> notification.readAt = readAt);
        return repository.saveAll(notifications);
    }

    @GetMapping(value = "/notifications/flux", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    Flux<ServerSentEvent<NotificationDto>> flux() {
        Flux<NotificationDto> history = Flux.fromIterable(repository.findTop20ByOrderByIdDesc()).map(NotificationDto::from);
        return Flux.concat(history, sink.asFlux())
                .map(dto -> ServerSentEvent.builder(dto).event("notification").build());
    }

    @RabbitListener(queues = "${studybridge.rabbit.queue}")
    public void onApplicationEvent(ApplicationEvent event) {
        Notification notification = new Notification();
        notification.applicationId = event.applicationId;
        notification.studyId = event.studyId;
        notification.studyTitle = event.studyTitle;
        notification.applicantName = event.applicantName;
        notification.status = event.status;
        notification.message = event.applicantName + "님의 " + event.studyTitle + " 신청 상태가 " + event.status + "로 변경되었습니다.";
        notification.createdAt = LocalDateTime.now();
        Notification saved = repository.save(notification);
        sink.tryEmitNext(NotificationDto.from(saved));
    }
}
