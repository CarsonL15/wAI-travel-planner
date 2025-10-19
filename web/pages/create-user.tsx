import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CreateUserModal from '../components/CreateUserModal';

// Single canonical page for the create-user modal. Supports query param ?step=name|interests
export default function CreateUserPage() {
  const router = useRouter();
  const [initialStep, setInitialStep] = useState<1 | 2>(1);

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
  return <CreateUserModal open={true} initialStep={initialStep} onClose={handleClose} />;
}
