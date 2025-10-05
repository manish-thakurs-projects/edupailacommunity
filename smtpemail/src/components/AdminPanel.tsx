import { useState } from 'react';
import AdminLoginForm from '@/components/AdminLoginForm';
import AdminOTPVerification from '@/components/AdminOTPVerification';

const AdminPanel = () => {
  const [isOtpRequested, setIsOtpRequested] = useState(false);

  const handleOtpRequest = () => {
    setIsOtpRequested(true);
  };

  const handleOtpVerification = () => {
    setIsOtpRequested(false);
  };

  return (
    <div className="admin-panel">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      {!isOtpRequested ? (
        <AdminLoginForm onOtpRequest={handleOtpRequest} />
      ) : (
        <AdminOTPVerification onVerify={handleOtpVerification} />
      )}
    </div>
  );
};

export default AdminPanel;