'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { signIn } from '@/lib/auth'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // Don't auto-redirect on mount - let the login flow handle it
  // This prevents redirect loops and conflicts with manual navigation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Attempting sign in for:', email)
      const result = await signIn(email, password)
      console.log('Sign in successful:', result)

      // Use window.location for reliable redirect after login
      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('Sign in error:', err)
      const errorMessage = err?.message || err?.error_description || 'Failed to sign in. Please check your credentials.'
      setError(errorMessage)
      setLoading(false)
    } finally {
      // Ensure loading is always reset after 10 seconds as a failsafe
      setTimeout(() => {
        setLoading(false)
      }, 10000)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome to ODS Cloud</h1>
          <p>Sign in to manage your digital signage network</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
                  fill="currentColor"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Need help?{' '}
            <a href="mailto:support@ods-cloud.com">Contact Support</a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: url('/ODS_Background.png') center/cover no-repeat;
          padding: 2rem;
        }

        .login-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 2.5rem;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        h1 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }

        .login-header p {
          color: #64748b;
          font-size: 0.9375rem;
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 0.875rem;
        }

        .error-message svg {
          flex-shrink: 0;
          color: #ef4444;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
        }

        input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: #f1f5f9;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          color: #0f172a;
          font-size: 0.9375rem;
          font-weight: 500;
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        }

        input:focus {
          outline: none;
          background: #ffffff;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .submit-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .login-footer {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          text-align: center;
        }

        .login-footer p {
          color: #94a3b8;
          font-size: 0.875rem;
          margin: 0;
        }

        .login-footer a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .login-footer a:hover {
          color: #60a5fa;
        }

        @media (max-width: 640px) {
          .login-card {
            padding: 2rem;
          }

          h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}
