import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>wAI Travel Planner — Home page</h1>
      <p>Welcome, insert user name. Lead the wAI.</p>

      <nav style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <Link href="/create-user"><button>Create User</button></Link>
        <Link href="/trip-preferences"><button>Trip Preferences</button></Link>
        <Link href="/itinerary-editor"><button>Itinerary Editor</button></Link>
      </nav>

      <section style={{ marginTop: '2rem' }}>
        <h2>Notes</h2>
        <ul>
          <li>Each page is a placeholder with a small form or editor.</li>
          <li>Remove auth/data wiring for now; add GraphQL/Auth later.</li>
        </ul>
      </section>
    </div>
  );
}
