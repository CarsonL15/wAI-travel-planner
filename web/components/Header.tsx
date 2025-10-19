import Link from 'next/link';
import { useRouter } from 'next/router';
import { CSSProperties, useState } from 'react';

export default function Header() {
  const router = useRouter();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const getButtonStyle = (buttonId: string): CSSProperties => ({
    padding: '0.5rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: hoveredButton === buttonId ? '#f5f5f5' : 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s'
  });

  return (
    <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #eee', marginBottom: '1.5rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <strong style={{ fontSize: '1.1rem' }}>wAI Travel Planner</strong>
        </Link>
        <nav style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/create-user" style={{ textDecoration: 'none' }}>
            <button 
              style={getButtonStyle('users')}
              onMouseEnter={() => setHoveredButton('users')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Users
            </button>
          </Link>
          <Link href="/trip-preferences" style={{ textDecoration: 'none' }}>
            <button 
              style={getButtonStyle('preferences')}
              onMouseEnter={() => setHoveredButton('preferences')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Preferences
            </button>
          </Link>
          <Link href="/itinerary-editor" style={{ textDecoration: 'none' }}>
            <button 
              style={getButtonStyle('editor')}
              onMouseEnter={() => setHoveredButton('editor')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Editor
            </button>
          </Link>
        </nav>
      </div>
    </header>
  );
}