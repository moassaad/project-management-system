package com.projectmanagementsystem.project.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * Composite key for project_members (project_id, user_id).
 */
public class ProjectMemberId implements Serializable {

    private UUID project;
    private UUID user;

    protected ProjectMemberId() {}

    public ProjectMemberId(UUID project, UUID user) {
        this.project = project;
        this.user = user;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProjectMemberId that)) return false;
        return Objects.equals(project, that.project) && Objects.equals(user, that.user);
    }

    @Override
    public int hashCode() {
        return Objects.hash(project, user);
    }
}
