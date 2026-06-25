import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      maxWidth: '640px',
      width: '100%',
      padding: '40px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '32px',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        borderRadius: '9999px',
        background: 'rgba(197, 168, 128, 0.1)',
        border: '1px solid rgba(197, 168, 128, 0.2)',
        color: 'var(--gold)',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        Backend API Server
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 700,
          fontFamily: 'var(--font-title)',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(to right, #ffffff, #c5a880)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          LuxeStore Engine
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#a1a1aa',
          lineHeight: '1.6',
          maxWidth: '480px',
          margin: '0 auto',
        }}>
          A robust, secure, and performant server powering the premium LuxeStore e-commerce application. Built with Next.js App Router, Prisma ORM, and PostgreSQL.
        </p>
      </div>

      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        width: '100%',
        padding: '24px',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>SYSTEM ENVIRONMENT</span>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#71717a' }}>Status:</span>
            <span style={{ color: '#10b981' }}>Online & Ready</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#71717a' }}>Framework:</span>
            <span style={{ color: '#e4e4e7' }}>Next.js 14.2 (App Router)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#71717a' }}>Database ORM:</span>
            <span style={{ color: '#e4e4e7' }}>Prisma Client v5.15</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#71717a' }}>Port:</span>
            <span style={{ color: '#e4e4e7' }}>3001</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
        <Link
          href="/api/health"
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            background: 'var(--foreground)',
            color: 'var(--background)',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
        >
          Verify API Health
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: '1px solid var(--card-border)',
            background: 'rgba(255, 255, 255, 0.02)',
            color: '#e4e4e7',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
        >
          Documentation
        </a>
      </div>
    </div>
  );
}
