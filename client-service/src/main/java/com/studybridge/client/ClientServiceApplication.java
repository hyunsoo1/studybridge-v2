package com.studybridge.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@SpringBootApplication
@EnableFeignClients
public class ClientServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ClientServiceApplication.class, args);
    }

    @Bean
    RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

@FeignClient(name = "studyFeignClient", url = "${services.study.url}")
interface StudyFeignClient {
    @GetMapping("/api/studies")
    List<Map<String, Object>> findStudies();
}

@RestController
@RequestMapping("/client")
class ClientController {
    private final RestTemplate restTemplate;
    private final StudyFeignClient feignClient;
    private final String studyUrl;

    ClientController(RestTemplate restTemplate, StudyFeignClient feignClient, @Value("${services.study.url}") String studyUrl) {
        this.restTemplate = restTemplate;
        this.feignClient = feignClient;
        this.studyUrl = studyUrl;
    }

    @GetMapping("/resttemplate/studies")
    Object restTemplateStudies() {
        return restTemplate.getForObject(studyUrl + "/api/studies", Object.class);
    }

    @GetMapping("/openfeign/studies")
    List<Map<String, Object>> openFeignStudies() {
        return feignClient.findStudies();
    }

    @GetMapping("/compare")
    Map<String, Object> compare() {
        Object restTemplateResult = restTemplateStudies();
        List<Map<String, Object>> openFeignResult = openFeignStudies();
        return Map.of("restTemplate", restTemplateResult, "openFeign", openFeignResult, "message", "RestTemplate과 OpenFeign으로 Study API 호출 완료");
    }
}
