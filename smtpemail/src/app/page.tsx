import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLoginForm from '@/components/AdminLoginForm';
import AdminPanel from '@/components/AdminPanel';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    router.push('/admin/panel'); // Redirect to admin panel after successful login
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-black text-white p-4">
        <h1 className="text-2xl">Edupaila Admin Panel</h1>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        {!isAuthenticated ? (
          <AdminLoginForm onLoginSuccess={handleLoginSuccess} />
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  );
}