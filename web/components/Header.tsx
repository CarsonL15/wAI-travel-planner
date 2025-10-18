import Link from 'next/link';

export default function Header() {
  return (
    <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #eee', marginBottom: '1.5rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/">
          <strong style={{ fontSize: '1.1rem' }}>wAI Travel Planner</strong>
        </Link>
        <nav style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/create-user"><button>Users</button></Link>
          <Link href="/trip-preferences"><button>Preferences</button></Link>
          <Link href="/itinerary-editor"><button>Editor</button></Link>
        </nav>
      </div>
    </header>
  );
}
