package com.projectmanagementsystem.project.repository;

import com.projectmanagementsystem.project.entity.ProjectMember;
import com.projectmanagementsystem.project.entity.ProjectMemberId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {
    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);
    List<ProjectMember> findByUserId(UUID userId);
    org.springframework.data.domain.Page<ProjectMember> findByUserId(
            UUID userId, org.springframework.data.domain.Pageable pageable);
    void deleteByProjectId(UUID projectId);
}
