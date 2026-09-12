package com.projectmanagementsystem.comment.dto;

import com.projectmanagementsystem.comment.entity.Comment;

public record CommentResponse(
        String id,
        String content,
        String authorId,
        String createdAt
) {
    public static CommentResponse from(Comment comment) {
        return new CommentResponse(
                comment.getId().toString(),
                comment.getContent(),
                comment.getAuthor().getId().toString(),
                comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null
        );
    }
}
