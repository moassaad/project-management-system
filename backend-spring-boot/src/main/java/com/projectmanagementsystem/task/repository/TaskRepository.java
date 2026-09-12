package com.projectmanagementsystem.task.repository;

import com.projectmanagementsystem.task.entity.Task;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    Page<Task> findByProjectId(UUID projectId, Pageable pageable);
    Optional<Task> findByProjectIdAndId(UUID projectId, UUID id);
    List<Task> findByProjectIdAndAssigneeId(UUID projectId, UUID assigneeId);

    @Query("""
            SELECT t FROM Task t WHERE t.project.id = :projectId
            AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%'))
                 OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:status IS NULL OR t.status = :status)
            AND (:type IS NULL OR t.type = :type)
            AND (:priority IS NULL OR t.priority = :priority)
            """)
    Page<Task> search(
            @Param("projectId") UUID projectId,
            @Param("search") String search,
            @Param("status") com.projectmanagementsystem.task.entity.TaskStatus status,
            @Param("type") com.projectmanagementsystem.task.entity.TaskType type,
            @Param("priority") com.projectmanagementsystem.task.entity.TaskPriority priority,
            Pageable pageable);
}
