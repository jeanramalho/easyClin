import React from 'react';

export default function EasyClinMark() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--color-primary-container)', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect x="40" y="40" width="120" height="120" rx="24" fill="white" />
      <path d="M70 70H130M70 100H110M70 130H130" stroke="url(#blueGrad)" strokeWidth="12" strokeLinecap="round" />
      <path d="M115 135L130 110L145 130L160 80" stroke="var(--color-inverse-primary)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
