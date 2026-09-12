package com.projectmanagementsystem.project.repository;

import com.projectmanagementsystem.project.entity.Project;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, UUID> {}
