package com.example.taskflow.controller;

import com.example.taskflow.model.Task;
import com.example.taskflow.repository.TaskRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskRepository repository;

    public TaskController(TaskRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }

    @GetMapping("/tasks")
    public List<Task> list() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public Task create(@Valid @RequestBody Task task) {
        task.setId(null);
        return repository.save(task);
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<Task> update(@PathVariable Long id, @Valid @RequestBody Task incoming) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setTitle(incoming.getTitle());
                    existing.setDescription(incoming.getDescription());
                    existing.setPriority(incoming.getPriority());
                    existing.setCompleted(incoming.isCompleted());
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/tasks/{id}/toggle")
    public ResponseEntity<Task> toggle(@PathVariable Long id) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setCompleted(!existing.isCompleted());
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
