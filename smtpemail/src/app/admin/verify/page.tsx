import { useState } from 'react';
import AdminOTPVerification from '@/components/AdminOTPVerification';

export default function VerifyPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const response = await fetch('/api/admin/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (response.ok) {
      setSuccess(true);
    } else {
      setError(data.error || 'Verification failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Verify OTP</h1>
      <AdminOTPVerification
        email={email}
        setEmail={setEmail}
        otp={otp}
        setOtp={setOtp}
        onSubmit={handleOtpSubmit}
        error={error}
        success={success}
      />
    </div>
  );
}