import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';

const INTERESTS_DATA = [
  { id: 'culinary', name: 'Culinary Journeys', icon: '🍽️' },
  { id: 'adventure', name: 'Adventure Sports', icon: '🧗' },
  { id: 'relaxation', name: 'Beach & Relaxation', icon: '🏖️' },
  { id: 'history', name: 'Historical Sites', icon: '🏛️' },
  { id: 'culture', name: 'Arts & Culture', icon: '🎭' },
  { id: 'nightlife', name: 'Nightlife & Events', icon: '🎤' },
  { id: 'nature', name: 'Nature & Outdoors', icon: '🌲' },
  { id: 'shopping', name: 'Shopping & Markets', icon: '🛍️' },
  { id: 'guided', name: 'Guided Tours', icon: '👟' },
  { id: 'family', name: 'Family Activities', icon: '👨‍👩‍👧‍👦' },
];

type Props = {
  open?: boolean;
  onClose?: () => void;
  onUserCreated?: (user?: { name?: string; interests?: string[] }) => void;
  initialStep?: 1 | 2;
};

export default function CreateUserModal({ open = true, onClose, onUserCreated, initialStep = 1 }: Props) {
   const { user, setUser } = useUser();

  const [step, setStep] = useState<1 | 2>(initialStep);
  const [name, setName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => setStep(initialStep), [initialStep]);

  // initialize modal fields from global user when opened
  useEffect(() => {
    if (!open) return;
    setName((user && (user.name || '')) ?? '');
    setSelectedInterests((user && Array.isArray(user.interests) ? user.interests : []) ?? []);
  }, [open, user]);

  if (!open) return null;

  const close = () => {
    onClose?.();
  };

  const goNext = () => setStep(2);
  const goBack = () => setStep(1);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (prev.length >= 5) {
        alert('You can select up to 5 interests.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleFinish = () => {
    const payload = { name, interests: selectedInterests };
    setUser(payload);
    // notify parent and close (parent will set hasProfile true and hide modal)
    onUserCreated?.(payload);
    alert(`Profile saved. Selected: ${selectedInterests.join(', ')}`);
    close();
  };

  /* Styles consolidated */
  const overlayStyle = {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem'
  };

  const baseContainer = {
    width: '100%',
    maxWidth: 760,
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#fff',
    borderRadius: 10,
    padding: '1rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
  };

  const containerStyle = {
    ...baseContainer,
    height: step === 1 ? '20vh' : '40vh',
    minHeight: step === 1 ? 180 : 300,
    justifyContent: 'center' as const
  };

  const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 };
  const scrollAreaStyle = { overflowY: 'auto' as const, flex: 1, paddingRight: 8 };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 };

  const interestBtnBase = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '1rem',
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'center' as const
  };

  const primaryButton = { padding: '0.6rem 1rem', borderRadius: 6 };
  const smallButton = { padding: '0.4rem 0.8rem', borderRadius: 6 };

  return (
    <div role="dialog" aria-modal="true" style={overlayStyle} onClick={close}>
      <div onClick={(e) => e.stopPropagation()} style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0 }}>{step === 1 ? 'Hello Explorer! What should we call you?' : 'Travel Styles'}</h2>
          <div>
            {step === 2 ? <button onClick={goBack} style={{ ...smallButton, marginRight: 8 }}>Back</button> : null}
            <button onClick={close} style={smallButton}>Close</button>
          </div>
        </div>

        <div style={scrollAreaStyle}>
          {step === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); goNext(); }}>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>You may change this at any time.</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ddd' }}
                />
              </label>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={close} style={smallButton}>Cancel</button>
                <button type="submit" style={primaryButton}>Next</button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                Select the styles that define your favorite trips (up to 5)
              </div>

              <div style={gridStyle}>
                {INTERESTS_DATA.map(item => {
                  const isSelected = selectedInterests.includes(item.id);
                  const interestStyle = {
                    ...interestBtnBase,
                    border: isSelected ? '2px solid #7725eb' : '1px solid #ddd',
                    background: isSelected ? '#f5eeff' : '#fff'
                  };
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleInterest(item.id)}
                      aria-pressed={isSelected}
                      style={interestStyle}
                    >
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>{item.icon}</div>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#555' }}>Selected: {selectedInterests.length} / 5</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleFinish} style={primaryButton}>Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}