import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { Button } from '../../../components/ui/Button.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { loginSchema, type LoginFormValues } from '../schemas/login.schema.ts'
import { useLoginMutation } from '../hooks/useLoginMutation.ts'
import { useAuthStore } from '../store/authStore.ts'

type ProblemDetails = {
  title?: string
  detail?: string
  status?: number
}

/**
 * Login page at /login (public route) — validated form, memory-only auth store.
 * Uses React Hook Form + zodResolver, submits via useLoginMutation (no direct Axios).
 */
export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const mutation = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { accessToken, user } = await mutation.mutateAsync(values)
      setAuth(user, accessToken)
      await navigate('/dashboard')
    } catch {
      // error handled via mutation.error below
    }
  }

  const getErrorMessage = (): string | null => {
    if (!mutation.error) return null
    const err = mutation.error as { response?: { data?: ProblemDetails }; message?: string }
    const data = err.response?.data
    // Prefer ProblemDetails detail, fallback to title, then generic
    if (data?.detail) return data.detail
    if (data?.title) return data.title
    if (err.message) return err.message
    return 'Login failed. Please try again.'
  }

  const errorMessage = getErrorMessage()
  const isLoading = mutation.isPending || isSubmitting

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <p className="text-sm text-gray-500">Sign in to continue</p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Login form"
            className="space-y-4"
          >
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p id="email-error" role="alert" className="text-sm text-red-600">
                {errors.email.message}
              </p>
            ) : null}

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password ? (
              <p id="password-error" role="alert" className="text-sm text-red-600">
                {errors.password.message}
              </p>
            ) : null}

            {errorMessage ? (
              <p role="alert" aria-live="polite" className="text-sm text-red-600">
                {errorMessage}
              </p>
            ) : null}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
