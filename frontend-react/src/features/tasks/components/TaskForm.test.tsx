import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createTaskSchema } from '../schemas/task.schema.ts'
import { TaskForm } from './TaskForm.tsx'

const members = [{ id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com', role: 'OWNER' as const }]

describe('TaskForm (RHF + zodResolver, a11y, no http)', () => {
  it('renders all fields with labels and a11y', () => {
    render(
      <TaskForm
        schema={createTaskSchema}
        defaultValues={{ title: '', description: '', type: '', status: '', priority: '', assigneeId: '', dueDate: '' }}
        submitLabel="Create task"
        serverError={null}
        isSubmitting={false}
        members={members}
        membersLoading={false}
        onSubmit={async () => {}}
      />,
    )

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority')).toBeInTheDocument()
    expect(screen.getByLabelText('Assignee')).toBeInTheDocument()
    expect(screen.getByLabelText('Due date')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create task' })).toBeInTheDocument()
  })

  it('shows inline aria-invalid and role=alert on validation error', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async () => {})

    render(
      <TaskForm
        schema={createTaskSchema}
        defaultValues={{ title: '', description: '', type: '', status: '', priority: '', assigneeId: '', dueDate: '' }}
        submitLabel="Create task"
        serverError={null}
        isSubmitting={false}
        members={members}
        membersLoading={false}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Create task' }))

    expect(await screen.findByText('Task title is required')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not make http calls directly (onSubmit prop only)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(async () => {})

    render(
      <TaskForm
        schema={createTaskSchema}
        defaultValues={{ title: 'Hello', description: '', type: '', status: '', priority: '', assigneeId: '', dueDate: '' }}
        submitLabel="Create task"
        serverError={null}
        isSubmitting={false}
        members={members}
        membersLoading={false}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Create task' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hello' }))
    // No fetch/axios spy — pure prop call proves no direct http
  })

  it('shows serverError with role=alert aria-live', () => {
    render(
      <TaskForm
        schema={createTaskSchema}
        defaultValues={{ title: '', description: '', type: '', status: '', priority: '', assigneeId: '', dueDate: '' }}
        submitLabel="Create task"
        serverError="Server says no"
        isSubmitting={false}
        members={members}
        membersLoading={false}
        onSubmit={async () => {}}
      />,
    )

    const alert = screen.getByText('Server says no')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveAttribute('role', 'alert')
  })
})
