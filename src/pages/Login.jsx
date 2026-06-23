import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/apiCall';

const GRID_SIZE = 40;

function GridBackground() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
          <path
            d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="0.8"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

function StepDots({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.4s ease',
              background: step >= s ? '#0f172a' : '#f1f5f9',
              color: step >= s ? '#ffffff' : '#94a3b8',
              border: step >= s ? '2px solid #0f172a' : '2px solid #e2e8f0',
            }}
          >
            {step > s ? '✓' : s}
          </div>
          {s < 3 && (
            <div style={{ flex: 1, height: 2, borderRadius: 1, background: '#e2e8f0', position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: '#0f172a',
                  transform: step > s ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: 'transform 0.5s ease',
                }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
      <span style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
        {step === 1 ? 'Identify' : step === 2 ? 'Verify' : 'Select Profile'}
      </span>
    </div>
  );
}

function Input({ id, label, value, onChange, placeholder, type = 'text', disabled, hint, maxLength, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 14px',
          fontSize: 15,
          fontFamily: 'inherit',
          background: '#f8fafc',
          border: `1.5px solid ${focused ? '#0f172a' : '#e2e8f0'}`,
          borderRadius: 8,
          color: '#0f172a',
          outline: 'none',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
          letterSpacing: id === 'otp' ? '0.3em' : 'normal',
        }}
      />
      {hint && (
        <p style={{ marginTop: 5, fontSize: 11, color: '#94a3b8' }}>{hint}</p>
      )}
    </div>
  );
}

function SubmitButton({ label, loading, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      style={{
        width: '100%',
        padding: '13px 0',
        background: disabled || loading ? '#cbd5e1' : '#0f172a',
        color: '#ffffff',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s, transform 0.1s',
        letterSpacing: '0.04em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
      onMouseDown={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {loading ? <Spinner /> : label}
    </button>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="9" cy="9" r="7" fill="none" stroke="white" strokeWidth="2" strokeDasharray="30 14" strokeLinecap="round" />
    </svg>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#b91c1c',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        marginBottom: 20,
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      ⚠ {message}
    </div>
  );
}

// Left panel info data
const FEATURES = [
  { icon: '📱', title: 'Mobile-based identity', desc: 'Your mobile number acts as your unique key — no username to remember.' },
  { icon: '◈', title: 'OTP verification', desc: 'A one-time code is sent to your registered mobile for every login.' },
  { icon: '◉', title: 'Zero stored passwords', desc: 'We never store credentials — each session is independently verified.' },
];

export default function Login() {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileSent, setMobileSent] = useState('');
  
  const [tempToken, setTempToken] = useState('');
  const [profiles, setProfiles] = useState([]);

  // Animate feature cards sequentially on mount
  const [visibleFeature, setVisibleFeature] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setVisibleFeature(v => (v < FEATURES.length ? v + 1 : v)), 300);
    return () => clearInterval(t);
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await apiCall('/auth/login/send-otp', 'POST', { country_code: countryCode, mobile });
      const data = await response.json();
      if (response.ok && data.success !== false) { // Assuming success=true or ok implies success
        setMobileSent(mobile);
        setStep(2);
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length < 4) {
      setError('Enter the OTP sent to your registered mobile.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await apiCall('/auth/login', 'POST', { country_code: countryCode, mobile: mobileSent, otp });
      const data = await response.json();
      if (response.ok && data.success !== false && data.token) {
        setTempToken(data.token);
        
        // Temporarily store token to allow apiCall to attach it to the header
        localStorage.setItem('ooms_user_data', JSON.stringify({ token: data.token }));
        
        // Fetch profiles
        const profileRes = await apiCall('/profile/list', 'GET');
        const profileData = await profileRes.json();
        
        if (profileRes.ok && profileData.success !== false && profileData.data && profileData.data.length > 0) {
          if (profileData.data.length === 1) {
            login(data.token, profileData.data[0], { countrycode: countryCode, mobile: mobileSent });
          } else {
            setProfiles(profileData.data);
            setStep(3);
          }
        } else {
          setError('No profiles found for this user.');
          localStorage.removeItem('ooms_user_data');
        }
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      localStorage.removeItem('ooms_user_data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSelect = (profile) => {
    login(tempToken, profile, { countrycode: countryCode, mobile: mobileSent });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        background: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .left-panel { display: none !important; }
          .right-panel { padding: 20px !important; }
          .login-card { padding: 24px 20px !important; }
        }
      `}</style>
      <GridBackground />

      {/* ── LEFT PANEL ── */}
      <div
        className="left-panel"
        style={{
          width: '42%',
          minHeight: '100vh',
          background: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 48px',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        {/* left grid overlay */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.07 }}>
          <defs>
            <pattern id="dgrid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#ffffff" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dgrid)" />
        </svg>

        {/* top: logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              ⬡
            </div>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 16, letterSpacing: '0.04em' }}>OOMS</span>
          </div>

          <h1 style={{ color: '#ffffff', fontSize: 30, fontWeight: 700, lineHeight: 1.25, margin: '0 0 12px' }}>
            Secure access,<br />simplified.
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: '0 0 48px' }}>
            Organisation Operations Management System uses your Mobile Number as your identity — no passwords, no friction.
          </p>

          {/* feature cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 14,
                  opacity: visibleFeature > i ? 1 : 0,
                  transform: visibleFeature > i ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, margin: '0 0 3px' }}>{f.title}</p>
                  <p style={{ color: '#475569', fontSize: 12, lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* bottom: badge */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            <span style={{ color: '#475569', fontSize: 12 }}>Secure channel active · 256-bit TLS</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="right-panel"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="login-card"
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            padding: '40px 36px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            boxSizing: 'border-box',
          }}
        >
          {/* card header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
              {step === 1 ? 'Enter your Mobile' : step === 2 ? 'Check your phone' : 'Select a Profile'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              {step === 1
                ? "We'll send a one-time code to your registered mobile."
                : step === 2 ? `Code sent to +${countryCode} ${mobileSent}.` : 'Choose the profile you want to access.'}
            </p>
          </div>

          <StepDots step={step} />
          <ErrorBanner message={error} />

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} key="step1" style={{ animation: 'slideIn 0.3s ease' }}>
              <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }`}</style>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '80px' }}>
                  <Input
                    id="countryCode"
                    label="Code"
                    value={`+${countryCode}`}
                    onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, ''))}
                    disabled={isSubmitting}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    id="mobile"
                    label="Mobile Number"
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10 digit number"
                    disabled={isSubmitting}
                    maxLength={10}
                    autoComplete="off"
                  />
                </div>
              </div>
              
              <SubmitButton label="Send OTP →" loading={isSubmitting} disabled={mobile.length !== 10 || !countryCode} />
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} key="step2" style={{ animation: 'slideIn 0.3s ease' }}>
              <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }`}</style>
              <Input
                id="otp"
                label="One-time code"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                type="text"
                maxLength={6}
                disabled={isSubmitting}
                hint="6-digit code, valid for 10 minutes"
                autoComplete="one-time-code"
              />

              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setOtp(''); }}
                  style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                >
                  ← Change Mobile
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSubmitting}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                >
                  Resend code
                </button>
              </div>

              <SubmitButton label="Verify & sign in" loading={isSubmitting} disabled={otp.length < 4} />
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div key="step3" style={{ animation: 'slideIn 0.3s ease' }}>
              <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }`}</style>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '300px', overflowY: 'auto' }}>
                {profiles.map((profile, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleProfileSelect(profile)}
                    style={{
                      padding: '14px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{profile.name}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Branch: {profile.branch?.name || 'N/A'}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{profile.email}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); localStorage.removeItem('ooms_user_data'); }}
                  style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          )}

          {/* Footer note */}
          <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 24, marginBottom: 0, lineHeight: 1.6 }}>
            By continuing you agree to OOMS{' '}
            <span style={{ color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Access</span>
          </p>
        </div>
      </div>
    </div>
  );
}