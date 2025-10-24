import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import CreateUserModal from '../components/CreateUserModal';

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: -1,
};

const centerNoProfile = {
  lat: 10, // Centered on Atlantic to show Americas and Africa
  lng: -30,
};

const staticMapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  gestureHandling: 'none',
};

// Single canonical page for the create-user modal. Supports query param ?step=name|interests
export default function CreateUserPage() {
  const router = useRouter();
  const [initialStep, setInitialStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = router.query.step;
    if (s === 'interests') setInitialStep(2);
    else setInitialStep(1);
  }, [router.query.step]);

  const handleClose = () => {
    // navigate back home when modal closes
    router.push('/', undefined, { shallow: true });
  };

  // Always render the modal open on this page so visiting /create-user opens the flow.
  return (
    <>
      <LoadScript 
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        onLoad={() => {
          console.log('Google Maps Script loaded successfully');
          setLoading(false);
        }}
        onError={(error) => {
          console.error('Google Maps Script failed to load:', error);
          setLoading(true);
        }}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle as any}
          center={centerNoProfile}
          zoom={3}
          options={staticMapOptions}
        />
      </LoadScript>
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.5)',
      }} />
      
      <CreateUserModal open={true} initialStep={initialStep} onClose={handleClose} />
    </>
  );
}
