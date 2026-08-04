'use client';

import Link from 'next/link';


export default function Footer() {
  return (
    <footer style={{ maxWidth: '1200px', margin: '80px auto 0', paddingTop: '80px', paddingBottom: '80px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: '64px', paddingLeft: '24px', paddingRight: '24px' }}>
      <div style={{ flex: '2 1 300px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <img src="/logo.png" alt="CreateForEarn Logo" style={{ height: '36px', width: '36px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>CreateForEarn</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
          © 2026 CreateForEarn. All rights reserved.
        </p>
      </div>
      
      <div style={{ flex: '1 1 150px' }}>
        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '24px', color: 'var(--text-primary)' }}>Product</div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', listStyle: 'none', padding: 0, margin: 0 }}>
          {['Features', 'Pricing', 'Testimonials', 'Integration'].map(link => (
            <li key={link}><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>{link}</Link></li>
          ))}
        </ul>
      </div>

      <div style={{ flex: '1 1 150px' }}>
        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '24px', color: 'var(--text-primary)' }}>Company</div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', listStyle: 'none', padding: 0, margin: 0 }}>
          {['FAQs', 'About Us', 'Privacy Policy', 'Terms of Services'].map(link => (
            <li key={link}><Link href={link === 'About Us' ? '/about' : '#'} style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>{link}</Link></li>
          ))}
        </ul>
      </div>

      <div style={{ flex: '1 1 150px' }}>
        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '24px', color: 'var(--text-primary)' }}>Resources</div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', listStyle: 'none', padding: 0, margin: 0 }}>
          {['Blog', 'Changelog', 'Brand', 'Help'].map(link => (
            <li key={link}><Link href="#" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>{link}</Link></li>
          ))}
        </ul>
      </div>

      <div style={{ flex: '1 1 150px' }}>
        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '24px', color: 'var(--text-primary)' }}>Social Links</div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', listStyle: 'none', padding: 0, margin: 0 }}>
          {['Facebook', 'Instagram', 'Youtube', 'LinkedIn'].map(social => (
            <li key={social}>
              <Link href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
                {social}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
