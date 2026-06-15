package com.studybridge.comment;

import jakarta.persistence.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@SpringBootApplication
public class CommentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CommentServiceApplication.class, args);
    }
}

@Entity
@Table(name = "comments")
class StudyComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public Long studyId;
    public String authorName;
    @Column(length = 2000)
    public String content;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    protected StudyComment() {
    }
}

interface CommentRepository extends JpaRepository<StudyComment, Long> {
    List<StudyComment> findByStudyIdOrderByIdAsc(Long studyId);
}

@RestController
@RequestMapping("/api/comments")
class CommentController {
    private final CommentRepository repository;

    CommentController(CommentRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/study/{studyId}")
    List<StudyComment> byStudy(@PathVariable long studyId) {
        return repository.findByStudyIdOrderByIdAsc(studyId);
    }

    @PostMapping
    StudyComment create(@RequestBody StudyComment comment) {
        comment.id = null;
        comment.createdAt = LocalDateTime.now();
        return repository.save(comment);
    }

    @PutMapping("/{id}")
    ResponseEntity<StudyComment> update(@PathVariable long id, @RequestBody StudyComment next) {
        return repository.findById(id).map(comment -> {
            comment.content = next.content;
            comment.updatedAt = LocalDateTime.now();
            return ResponseEntity.ok(repository.save(comment));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
