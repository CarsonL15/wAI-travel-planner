import Link from 'next/link';
import { useState } from 'react';
import CreateUserModal from '../components/CreateUserModal';

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>wAI Travel Planner — Home page</h1>
      <p>Welcome, insert user name. Lead the wAI.</p>

      <nav style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button onClick={() => setShowCreateModal(true)}>Create User (overlay)</button>
        <Link href="/create-user/name"><button>Create User (step 1)</button></Link>
        <Link href="/create-user/interests"><button>Create User (step 2)</button></Link>
      </nav>

      <section style={{ marginTop: '2rem' }}>
        <h2>Notes</h2>
        <ul>
          <li>Each page is a placeholder with a small form or editor.</li>
          <li>Remove auth/data wiring for now; add GraphQL/Auth later.</li>
        </ul>
      </section>

      <CreateUserModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
