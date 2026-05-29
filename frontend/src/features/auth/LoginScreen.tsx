import React, { useState } from 'react';
import { auth } from '../../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

export function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const demoEmail = 'receptionist@mmcy.com';
      const demoPassword = 'Password123!';
      try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          await updateProfile(userCredential.user, { 
            displayName: 'MMCY Receptionist',
            photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=MMCY'
          });
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Demo Sign-In failed: ' + (err.message || 'unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFF1EB', // Warm background match
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(244, 123, 32, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(0, 90, 180, 0.05) 0%, transparent 40%)',
      fontFamily: 'var(--font-family, sans-serif)',
      boxSizing: 'border-box',
      padding: '24px',
    }}>
      <div className="card-elevated" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: '#FFF8F6', // Warm light-orange surface
        border: '1.5px solid var(--outline-variant, #E0C0B2)',
        borderRadius: 'var(--radius-lg, 16px)',
        boxShadow: 'var(--shadow-lg)',
        boxSizing: 'border-box',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <img
            src="/logo.png"
            alt="MMCY Logo"
            style={{ width: '150px', height: '60px', objectFit: 'contain', marginBottom: '8px' }}
          />
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--secondary, #0D1B3D)', letterSpacing: '-0.5px', margin: 0 }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--secondary-50, rgba(13, 27, 61, 0.5))', fontWeight: 600, margin: 0 }}>
            {isSignUp ? 'Sign up to manage receptionist check-ins' : 'Please sign in to access the receptionist console'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 67, 54, 0.08)',
            color: '#f44336',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm, 8px)',
            fontSize: '13px',
            fontWeight: 600,
            border: '1px solid rgba(244, 67, 54, 0.15)',
            lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isSignUp && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--secondary-70, #0D1B3D)' }}>FULL NAME</label>
              <input
                type="text"
                className="input-soft"
                placeholder="Enter your name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--secondary-70, #0D1B3D)' }}>EMAIL ADDRESS</label>
            <input
              type="email"
              className="input-soft"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--secondary-70, #0D1B3D)' }}>PASSWORD</label>
            <input
              type="password"
              className="input-soft"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '16px',
              background: 'var(--primary, #f47b20)',
              color: 'var(--on-primary, #ffffff)',
              border: 'none',
              borderRadius: 'var(--radius-md, 12px)',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '8px',
              fontSize: '15px',
              boxShadow: 'var(--shadow-glow)',
              transition: 'transform 0.15s, opacity 0.15s, background-color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          textAlign: 'center',
          color: 'var(--secondary-50, rgba(13, 27, 61, 0.5))',
          fontSize: '12px',
          margin: '4px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--outline-variant, #E0C0B2)', opacity: 0.5 }}></div>
          <span style={{ padding: '0 12px', fontWeight: 600 }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--outline-variant, #E0C0B2)', opacity: 0.5 }}></div>
        </div>

        {/* Social / Demo buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px',
              background: '#FFFFFF',
              color: 'var(--secondary, #0D1B3D)',
              border: '1.5px solid var(--outline-variant, #E0C0B2)',
              borderRadius: 'var(--radius-md, 12px)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: 'var(--shadow-soft)',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFF8F6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.75-2.9c-1.04.7-2.38 1.11-4.21 1.11-3.24 0-5.97-2.19-6.95-5.15H1.18v3.01C3.17 21.81 7.27 24 12 24z" />
              <path fill="#FBBC05" d="M5.05 14.15a7.12 7.12 0 0 1 0-4.3v-3L1.18 3.84a11.96 11.96 0 0 0 0 16.32l3.87-3.01z" />
              <path fill="#4285F4" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.27 0 3.17 2.19 1.18 5.84l3.87 3.01c.98-2.96 3.71-5.1 6.95-5.1z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.6-.2-2.37H12v4.51h6.45c-.28 1.49-1.12 2.76-2.38 3.6l3.7 2.87c2.16-1.99 3.42-4.91 3.42-8.61z" />
            </svg>
            Sign in with Google
          </button>
          
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            style={{
              padding: '14px',
              background: 'rgba(244, 123, 32, 0.08)',
              color: 'var(--primary, #f47b20)',
              border: '1.5px dashed var(--primary, #f47b20)',
              borderRadius: 'var(--radius-md, 12px)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 123, 32, 0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 123, 32, 0.08)'}
          >
            🔑 Demo Quick Sign-In
          </button>
        </div>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '4px' }}>
          <span style={{ color: 'var(--secondary-50, rgba(13, 27, 61, 0.5))', fontWeight: 500 }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary, #f47b20)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
