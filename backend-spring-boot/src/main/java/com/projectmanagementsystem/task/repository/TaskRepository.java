package com.projectmanagementsystem.task.repository;

import com.projectmanagementsystem.task.entity.Task;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    Page<Task> findByProjectId(UUID projectId, Pageable pageable);
    Optional<Task> findByProjectIdAndId(UUID projectId, UUID id);
    List<Task> findByProjectIdAndAssigneeId(UUID projectId, UUID assigneeId);
}
