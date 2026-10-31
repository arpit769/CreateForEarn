'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface AlertPayload {
  id: number;
  message: string;
  isConfirmation: boolean;
  duration: number; // in milliseconds (1000ms for confirmation)
  hostname: string;
}

interface ActiveAlertState {
  payload: AlertPayload;
  closing: boolean;
  progressStarted: boolean;
}

// Check whether a message represents a server action completion / confirmation
export function isConfirmationMessage(msg: string): boolean {
  if (!msg || typeof msg !== 'string') return false;
  const lower = msg.toLowerCase().trim();

  // Explicit failure / error / warning patterns
  if (
    lower.startsWith('error') ||
    lower.startsWith('failed') ||
    lower.startsWith('delete failed') ||
    lower.startsWith('operation failed') ||
    lower.startsWith('submission failed') ||
    lower.startsWith('approval failed') ||
    lower.startsWith('rejection failed') ||
    lower.startsWith('ban failed') ||
    lower.startsWith('unban failed') ||
    lower.startsWith('removal failed') ||
    lower.startsWith('deletion failed') ||
    lower.startsWith('upload failed') ||
    lower.startsWith('update failed') ||
    lower.startsWith('save rates failed') ||
    lower.startsWith('top up failed') ||
    lower.startsWith('please ') ||
    lower.startsWith('cannot ') ||
    lower.startsWith('insufficient ') ||
    lower.includes('is not a valid') ||
    lower.includes('must be at least') ||
    lower.includes('must be in the future') ||
    lower.includes('is required') ||
    lower.includes('is compulsory')
  ) {
    return false;
  }

  // Explicit confirmation keywords
  if (
    lower.includes('success') ||
    lower.includes('successfully') ||
    lower.includes('deleted') ||
    lower.includes('created') ||
    lower.includes('updated') ||
    lower.includes('claimed') ||
    lower.includes('submitted') ||
    lower.includes('approved') ||
    lower.includes('verified') ||
    lower.includes('saved') ||
    lower.includes('completed') ||
    lower.includes('done') ||
    lower.includes('removed') ||
    lower.includes('added') ||
    lower.includes('unbanned') ||
    lower.includes('copied') ||
    lower.includes('republished')
  ) {
    return true;
  }

  return false;
}

function getHostnameString(): string {
  if (typeof window === 'undefined') return 'www.createforearn.com';
  const host = window.location.hostname;
  if (!host) return 'www.createforearn.com';
  if (host === 'localhost' || host === '127.0.0.1') return 'localhost';
  return host;
}

// Module-level emitter for direct triggers or window.alert
let globalAlertDispatcher: ((payload: AlertPayload) => void) | null = null;

export function triggerGlobalAlert(message?: unknown, customDuration?: number) {
  const msg = String(message ?? '');
  const isConf = isConfirmationMessage(msg);
  // User requirement: 1 sec (1000ms) timer for confirmation boxes
  const duration = customDuration !== undefined 
    ? customDuration 
    : (isConf ? 1000 : 4500);

  const payload: AlertPayload = {
    id: Date.now() + Math.random(),
    message: msg,
    isConfirmation: isConf,
    duration,
    hostname: getHostnameString(),
  };

  if (globalAlertDispatcher) {
    globalAlertDispatcher(payload);
  } else if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-global-alert', { detail: payload }));
  }
}

export default function GlobalAlertModal() {
  const [alertState, setAlertState] = useState<ActiveAlertState | null>(null);

  const closeAlert = () => {
    setAlertState((prev) => {
      if (!prev || prev.closing) return prev;
      setTimeout(() => setAlertState(null), 200);
      return { ...prev, closing: true };
    });
  };

  // Dedicated timer effect when an alert is set
  const currentId = alertState?.payload.id;
  const currentDuration = alertState?.payload.duration;
  const isClosing = alertState?.closing;

  useEffect(() => {
    if (!currentId || isClosing) return;

    // Trigger smooth progress shrink to 0%
    const animTimer = setTimeout(() => {
      setAlertState((prev) => (prev && !prev.closing ? { ...prev, progressStarted: true } : prev));
    }, 20);

    // Auto-close after duration (1000ms for confirmation boxes)
    const autoCloseTimer = setTimeout(() => {
      setAlertState((prev) => {
        if (!prev || prev.closing) return prev;
        setTimeout(() => setAlertState(null), 200);
        return { ...prev, closing: true };
      });
    }, currentDuration);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(autoCloseTimer);
    };
  }, [currentId, currentDuration, isClosing]);

  // Window alert override and custom events (mounted ONCE)
  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (msg?: unknown) => {
      triggerGlobalAlert(msg);
    };

    globalAlertDispatcher = (payload: AlertPayload) => {
      setAlertState({ payload, closing: false, progressStarted: false });
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<AlertPayload>;
      if (customEvent.detail) {
        setAlertState({ payload: customEvent.detail, closing: false, progressStarted: false });
      }
    };
    window.addEventListener('app-global-alert', handleCustomEvent);

    return () => {
      window.alert = originalAlert;
      globalAlertDispatcher = null;
      window.removeEventListener('app-global-alert', handleCustomEvent);
    };
  }, []);

  // Keyboard shortcut listener for Enter / Escape to dismiss immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        closeAlert();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!alertState) return null;

  const { payload, closing, progressStarted } = alertState;
  const isVisible = !closing;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: isVisible ? 'translate(-50%, 0) scale(1)' : 'translate(-50%, -12px) scale(0.96)',
        opacity: isVisible ? 1 : 0,
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease-out',
        zIndex: 9999999,
        pointerEvents: 'auto',
        maxWidth: '440px',
        width: 'calc(100vw - 32px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#161b22',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '14px',
          boxShadow: '0 20px 45px -8px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(16px)',
          padding: '18px 20px 16px 20px',
          color: '#f0f6fc',
          fontFamily: 'inherit',
        }}
      >
        {/* Header: domain says + icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {payload.isConfirmation ? (
              <CheckCircle2 size={16} color="#10b981" />
            ) : (
              <AlertTriangle size={16} color="#f59e0b" />
            )}
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#8b949e',
                letterSpacing: '-0.01em',
              }}
            >
              {payload.hostname} says
            </span>
          </div>

          <button
            onClick={closeAlert}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'color 120ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8b949e')}
          >
            <X size={14} />
          </button>
        </div>

        {/* Message body */}
        <div
          style={{
            fontSize: '14.5px',
            lineHeight: 1.5,
            color: '#f0f6fc',
            fontWeight: 400,
            marginBottom: '18px',
            wordBreak: 'break-word',
            paddingLeft: '2px',
          }}
        >
          {payload.message}
        </div>

        {/* Action button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <button
            onClick={closeAlert}
            autoFocus
            style={{
              backgroundColor: '#262c36',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '9999px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
              padding: '6px 20px',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 120ms ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '64px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#303744';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#262c36';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
            }}
          >
            OK
          </button>
        </div>

        {/* 1-second auto-close progress bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '2.5px',
            width: progressStarted ? '0%' : '100%',
            backgroundColor: payload.isConfirmation ? '#10b981' : '#f59e0b',
            transition: progressStarted ? `width ${payload.duration}ms linear` : 'none',
            boxShadow: payload.isConfirmation
              ? '0 0 8px rgba(16, 185, 129, 0.6)'
              : '0 0 8px rgba(245, 158, 11, 0.6)',
          }}
        />
      </div>
    </div>
  );
}
