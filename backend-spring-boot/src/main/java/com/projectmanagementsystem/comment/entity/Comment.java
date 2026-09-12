package com.projectmanagementsystem.comment.entity;

import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.common.entity.BaseEntity;
import com.projectmanagementsystem.task.entity.Task;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

/**
 * Comment persistence — belongs to exactly one task, authored by a user,
 * content required. No editing/deletion in MVP. No endpoints yet.
 */
@Entity
@Table(name = "comments")
public class Comment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    protected Comment() {
        // JPA
    }

    public Comment(Task task, User author, String content) {
        this.task = task;
        this.author = author;
        this.content = content;
    }

    public Task getTask() {
        return task;
    }

    public User getAuthor() {
        return author;
    }

    public String getContent() {
        return content;
    }
}
