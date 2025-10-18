import { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Profile {
  id: string;
  interests: string[];
  travelStyle: string;
  budget: string;
  constraints: string[];
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile>({
    id: '',
    interests: [],
    travelStyle: '',
    budget: '',
    constraints: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadProfile();
  }, []);

  const checkAuth = async () => {
    try {
      await Auth.currentAuthenticatedUser();
    } catch (error) {
      router.push('/');
    }
  };

  const loadProfile = async () => {
    // TODO: Load profile from GraphQL
    setLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      // TODO: Save profile via GraphQL mutation
      console.log('Saving profile:', profile);
      alert('Profile saved! (TODO: Implement actual save)');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const addInterest = () => {
    const interest = prompt('Enter an interest:');
    if (interest) {
      setProfile(prev => ({
        ...prev,
        interests: [...prev.interests, interest],
      }));
    }
  };

  const removeInterest = (index: number) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Your Profile</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Interests</h2>
        <div style={{ marginBottom: '1rem' }}>
          {profile.interests.map((interest, index) => (
            <span
              key={index}
              style={{
                display: 'inline-block',
                background: '#f0f0f0',
                padding: '0.5rem',
                margin: '0.25rem',
                borderRadius: '4px',
              }}
            >
              {interest}
              <button
                onClick={() => removeInterest(index)}
                style={{ marginLeft: '0.5rem', background: 'none', border: 'none' }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <button onClick={addInterest}>Add Interest</button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label>
          Travel Style:
          <select
            value={profile.travelStyle}
            onChange={(e) => setProfile(prev => ({ ...prev, travelStyle: e.target.value }))}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="">Select style</option>
            <option value="budget">Budget</option>
            <option value="mid-range">Mid-range</option>
            <option value="luxury">Luxury</option>
            <option value="adventure">Adventure</option>
            <option value="cultural">Cultural</option>
            <option value="relaxation">Relaxation</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label>
          Budget:
          <select
            value={profile.budget}
            onChange={(e) => setProfile(prev => ({ ...prev, budget: e.target.value }))}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="">Select budget</option>
            <option value="under-500">Under $500</option>
            <option value="500-1000">$500 - $1,000</option>
            <option value="1000-2500">$1,000 - $2,500</option>
            <option value="2500-5000">$2,500 - $5,000</option>
            <option value="over-5000">Over $5,000</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <button onClick={saveProfile} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <Link href="/dashboard">
        <button>Back to Dashboard</button>
      </Link>
    </div>
  );
}
