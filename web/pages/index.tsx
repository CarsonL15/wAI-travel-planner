import { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
      if (currentUser) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.log('No authenticated user');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    try {
      await Auth.signIn('username', 'password'); // TODO: Implement proper sign-in form
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const signUp = async () => {
    try {
      await Auth.signUp({
        username: 'username',
        password: 'password',
        attributes: {
          email: 'user@example.com',
        },
      }); // TODO: Implement proper sign-up form
    } catch (error) {
      console.error('Sign up error:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>wAI Travel Planner</h1>
      <p>Generate personalized travel itineraries based on your interests, travel style, and budget.</p>
      
      {!user ? (
        <div>
          <h2>Get Started</h2>
          <button onClick={signIn} style={{ marginRight: '1rem' }}>
            Sign In
          </button>
          <button onClick={signUp}>
            Sign Up
          </button>
        </div>
      ) : (
        <div>
          <p>Welcome, {user.username}!</p>
          <Link href="/dashboard">
            <button>Go to Dashboard</button>
          </Link>
        </div>
      )}
    </div>
  );
}
