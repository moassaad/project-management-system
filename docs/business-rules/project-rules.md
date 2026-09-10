# 2. Business Rules

## 2.1 Authentication

1. Only authenticated users may access the internal application.
2. Unauthenticated users may access the login page.
3. Authentication is handled by the backend.
4. The backend is the final authority regarding authentication state.
5. The frontend may maintain authentication-related UI state, but must not be considered a security boundary.

---

## 2.2 Project Rules

1. A project has exactly one Project Owner.
2. The user who creates a project automatically becomes its Project Owner.
3. The Project Owner is also a project member.
4. The Project Owner cannot be removed from the project.
5. A Project Owner may edit the project.
6. A Project Owner may delete the project.
7. Deleting a project requires explicit confirmation from the user.
8. Deleting a project also deletes its associated tasks and comments according to the backend's persistence rules.
9. A user who is not a project member cannot access the project or its tasks.
10. A user may belong to multiple projects.

---

## 2.3 Project Member Rules

1. The Project Owner may add existing users to a project.
2. The Project Owner may remove project members.
3. A removed member immediately loses access to the project.
4. Removing a member does not delete their previously created tasks.
5. Tasks assigned to a removed member become Unassigned.
6. A project member may view the project and its tasks.
7. A project member may create tasks.
8. A project member may add comments.

---

## 2.4 Task Rules

1. Every task belongs to exactly one project.
2. Task Title is required.
3. Task Description is optional.
4. Task Type is optional unless future business rules require it.
5. Task Status defaults to `TODO` when not explicitly provided.
6. Task Priority defaults to `MEDIUM` when not explicitly provided.
7. A task may be unassigned.
8. If a task is assigned, its assignee must be a current member of the project.
9. The Project Owner may edit any task in the project.
10. The Project Owner may delete any task in the project.
11. The Task Assignee may edit their assigned task.
12. The Task Assignee may delete their assigned task.
13. Other project members may view the task and add comments but may not edit or delete it.
14. Backend authorization is the final authority for task permissions.

---

## 2.5 Comment Rules

1. A comment belongs to exactly one task.
2. Only project members may view or create comments for tasks in the project.
3. Any project member may add a comment.
4. Non-members cannot access task comments.
5. Comment content is required.
6. Comment editing/deletion is not part of the initial MVP.

---

## 2.6 Authorization Principle

The frontend may hide or disable actions based on known permissions to improve user experience.

However:

> Frontend authorization is not a security mechanism.

Every protected operation must be authorized by the backend.

For example, hiding the Delete button from a non-owner is useful for UX, but the backend must independently reject an unauthorized delete request.

---
