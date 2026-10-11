
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      const { data, error: adminError } =
        await supabase.rpc('is_admin');

      if (adminError) {
        await supabase.auth.signOut();
        throw adminError;
      }

      if (data !== true) {
        await supabase.auth.signOut();
        throw new Error(
          'Access denied. This account is not an authorized admin.'
        );
      }

      router.replace('/');
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#f3f4f6',
        padding: 20,
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#fff',
          padding: 32,
          borderRadius: 12,
          boxShadow: '0 4px 20px #00000012',
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 8, color:'black'}}>
          Grocery Admin
        </h1>

        <p style={{ color: '#666', marginBottom: 24 }}>
          Sign in to manage your grocery store.
        </p>

        <label htmlFor="email" style={colorBlack}>Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <label htmlFor="password" style={colorBlack}>Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        {error && (
          <p style={{ color: '#dc2626', marginBottom: 16 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            border: 0,
            borderRadius: 6,
            background: '#15803d',
            color: '#fff',
            fontSize: 16,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  color: 'black',
  boxSizing: 'border-box',
  padding: 12,
  marginTop: 8,
  marginBottom: 20,
  border: '1px solid #d1d5db',
  borderRadius: 6,
};

const colorBlack:React.CSSProperties = {
    color: 'black',
  };
  
