import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
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
      onClose();
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
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Demo Sign-In failed: ' + (err.message || 'unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(37, 25, 19, 0.4)', // Warm overlay match
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.25s ease-out',
    }}>
      <div style={{
        background: 'var(--surface-container-low, #FFF1EB)',
        border: '1.5px solid var(--outline-variant, #E0C0B2)',
        borderRadius: 'var(--radius-xl, 24px)',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: 'var(--shadow-card), 0 20px 40px rgba(37, 25, 19, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        fontFamily: 'var(--font-family, system-ui)',
        color: 'var(--on-surface, #251913)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--secondary, #0D1B3D)', letterSpacing: '-0.5px' }}>
              {isSignUp ? 'Join MMCY Reception' : 'Welcome Back'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--secondary-50)', marginTop: '4px' }}>
              {isSignUp ? 'Create your administrator account' : 'Please sign in to access control panel'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{
              background: 'rgba(13, 27, 61, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'var(--secondary, #0D1B3D)',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(13, 27, 61, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(13, 27, 61, 0.05)'}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(186, 26, 26, 0.06)',
            border: '1px solid rgba(186, 26, 26, 0.2)',
            borderRadius: 'var(--radius-sm, 8px)',
            padding: '12px 16px',
            color: 'var(--error, #BA1A1A)',
            fontSize: '13px',
            lineHeight: 1.5,
            fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isSignUp && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--secondary-70, rgba(13, 27, 61, 0.7))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                required
                style={{
                  padding: '14px 16px',
                  background: 'var(--surface, #FFF8F6)',
                  border: '1.5px solid var(--outline-variant, #E0C0B2)',
                  borderRadius: 'var(--radius-md, 12px)',
                  color: 'var(--on-surface, #251913)',
                  fontSize: '14px',
                  fontWeight: 500,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--secondary-70, rgba(13, 27, 61, 0.7))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="receptionist@mmcy.com"
              required
              style={{
                padding: '14px 16px',
                background: 'var(--surface, #FFF8F6)',
                border: '1.5px solid var(--outline-variant, #E0C0B2)',
                borderRadius: 'var(--radius-md, 12px)',
                color: 'var(--on-surface, #251913)',
                fontSize: '14px',
                fontWeight: 500,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--secondary-70, rgba(13, 27, 61, 0.7))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={{
                padding: '14px 16px',
                background: 'var(--surface, #FFF8F6)',
                border: '1.5px solid var(--outline-variant, #E0C0B2)',
                borderRadius: 'var(--radius-md, 12px)',
                color: 'var(--on-surface, #251913)',
                fontSize: '14px',
                fontWeight: 500,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--outline-variant)'}
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
