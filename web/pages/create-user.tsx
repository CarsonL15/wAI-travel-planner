import { useState } from 'react';
import Link from 'next/link';

export default function CreateUser() {
  const [form, setForm] = useState({ username: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Create user data:', form);
    alert('User create submitted (placeholder).');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 700, margin: '0 auto' }}>
      <h1>Create User Profile</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Username: <input value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email: <input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} type="email" /></label>
        </div>
        <button type="submit">Create</button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <Link href="/"><button>Back Home</button></Link>
      </div>
    </div>
  );
}
