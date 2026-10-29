import { useState } from 'react';
import { supabase } from './supabaseClient.js';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          setMessage('Account created successfully!');
        } else {
          setMessage(
            'Account created. Check your email for a confirmation link if required.'
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: '420px',
        margin: '60px auto',
        padding: '28px',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>Campus Notes Hub</h1>
      <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
      <p>
        {isSignUp
          ? 'Sign up to access and share study notes.'
          : 'Sign in to access your study notes.'}
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px',
            margin: '8px 0 18px',
          }}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px',
            margin: '8px 0 18px',
          }}
        />

        {errorMessage && (
          <p role="alert" style={{ color: '#b91c1c' }}>
            {errorMessage}
          </p>
        )}

        {message && (
          <p role="status" style={{ color: '#15803d' }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading
            ? 'Please wait...'
            : isSignUp
              ? 'Create Account'
              : 'Sign In'}
        </button>
      </form>

      <p style={{ marginTop: '20px' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage('');
            setErrorMessage('');
          }}
          style={{
            border: 'none',
            background: 'none',
            color: '#2563eb',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </main>
  );
}
