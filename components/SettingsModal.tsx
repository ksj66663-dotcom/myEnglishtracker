'use client';

import { useEffect, useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EudicTestResponse {
  ok: boolean;
  code?: string | null;
  message: string;
  details?: string;
  categoryCount?: number;
}

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTestMsg('');
    setSaved(false);
    fetch('/api/settings?key=eudic_token')
      .then((r) => r.json())
      .then((d) => setToken((d as { value?: string }).value ?? ''))
      .catch((err) => {
        console.error('Load settings failed:', err);
        setTestMsg('Failed to load settings. Please try again.');
      });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const saveToken = async () => {
    const trimmedToken = token.trim();
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'eudic_token', value: trimmedToken }),
    });
    if (!res.ok) throw new Error('save settings failed');
    return trimmedToken;
  };

  const handleSave = async () => {
    try {
      setSaving(true); setSaved(false);
      const trimmedToken = await saveToken();
      setToken(trimmedToken); setSaved(true);
    } catch (err) {
      console.error('Save token failed:', err);
      setTestMsg('Save failed. Please try again.');
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    if (!token.trim()) { setTestMsg('Token is empty — fill in the field first.'); return; }
    try {
      setTesting(true); setTestMsg('');
      const trimmedToken = await saveToken();
      setToken(trimmedToken);
      const res = await fetch('/api/eudic/test');
      let data: EudicTestResponse;
      try { data = await res.json() as EudicTestResponse; }
      catch { setTestMsg('API route error — check server logs.'); return; }
      if (res.ok && data.ok) { setTestMsg(data.message); return; }
      switch (res.status) {
        case 400: setTestMsg('Token is missing or malformed.'); break;
        case 401: setTestMsg('Token invalid — check the Eudic OpenAPI portal.'); break;
        case 403: setTestMsg('Eudic API access denied (403).'); break;
        case 500: setTestMsg('API route error — check server logs.'); break;
        case 502:
          if (data.code === 'NETWORK_ERROR') setTestMsg('Network connection failed.');
          else if (data.code === 'UPSTREAM_ERROR') setTestMsg(data.message || 'Eudic server error (500).');
          else setTestMsg(data.message || 'Test failed — check server logs.');
          break;
        default: setTestMsg(data.message || 'Test failed — check server logs.');
      }
    } catch (err) {
      console.error('Test Eudic connection failed:', err);
      setTestMsg('Network connection failed.');
    } finally { setTesting(false); }
  };

  if (!isOpen) return null;

  const isSuccess = testMsg.includes('✓') || testMsg.toLowerCase().includes('success') || testMsg.toLowerCase().includes('connected');

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(31,31,31,0.55)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="paper-texture"
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: '420px',
          background: 'var(--color-paper)',
          borderRadius: '4px',
          padding: '36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'notebook-open 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 300, color: 'var(--color-ink)', lineHeight: 1 }}>
              Settings
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.22em', opacity: 0.45, marginTop: '6px', color: 'var(--color-ink)' }}>
              EUDIC DICTIONARY · API CONFIGURATION
            </div>
          </div>
          <button onClick={onClose} className="circle-btn-sm" aria-label="Close settings">
            <CloseIcon />
          </button>
        </div>

        <div style={{ borderBottom: '1px dashed rgba(31,31,31,0.12)', marginBottom: '24px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Token input */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase',
              letterSpacing: '0.2em', opacity: 0.6, marginBottom: '8px', color: 'var(--color-ink)',
            }}>
              EUDIC DICTIONARY — API TOKEN
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => { setToken(e.target.value); setSaved(false); setTestMsg(''); }}
              placeholder="Obtain from Eudic OpenAPI portal…"
              style={{
                width: '100%', padding: '10px 0', background: 'transparent',
                border: 'none', borderBottom: '1px solid rgba(31,31,31,0.2)',
                outline: 'none', color: 'var(--color-ink)',
                fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.05em',
              }}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--color-terracotta)'; }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(31,31,31,0.2)'; }}
            />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.35, color: 'var(--color-ink)', marginTop: '6px' }}>
              USES NIS AUTHORIZATION PREFIX · STORED LOCALLY ONLY
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: '10px',
                background: saved ? 'var(--color-mustard)' : 'var(--color-ink)',
                color: saved ? 'var(--color-ink)' : 'var(--color-paper)',
                border: 'none', borderRadius: '3px',
                cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'SAVING…' : saved ? 'SAVED ✓' : 'SAVE'}
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              style={{
                flex: 1, padding: '10px',
                background: 'transparent', color: 'var(--color-ink)',
                border: '1px solid rgba(31,31,31,0.15)', borderRadius: '3px',
                cursor: testing ? 'wait' : 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em',
                opacity: testing ? 0.6 : 1,
              }}
            >
              {testing ? 'TESTING…' : 'TEST CONNECTION'}
            </button>
          </div>

          {/* Test result */}
          {testMsg && (
            <div style={{
              padding: '10px 14px', borderRadius: '3px',
              background: isSuccess ? 'rgba(74,124,78,0.08)' : 'rgba(198,93,59,0.08)',
              border: `1px solid ${isSuccess ? 'rgba(74,124,78,0.2)' : 'rgba(198,93,59,0.2)'}`,
              fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em',
              color: isSuccess ? '#4A7C4E' : 'var(--color-terracotta)',
              textAlign: 'center',
            }}>
              {testMsg}
            </div>
          )}

          {/* Footer note */}
          <div style={{
            borderTop: '1px dashed rgba(31,31,31,0.1)', paddingTop: '16px',
            fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '0.06em',
            opacity: 0.35, color: 'var(--color-ink)', textAlign: 'center', lineHeight: 1.6,
          }}>
            Your API token is stored only in the local database and is never transmitted to any service other than the Eudic OpenAPI.
          </div>
        </div>
      </div>
    </div>
  );
}
