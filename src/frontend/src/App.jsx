import { useState } from 'react';
import { useActor } from './useActor';
import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import SwapPage from './pages/SwapPage';
import OrdersPage from './pages/OrdersPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  const [currentPage, setCurrentPage] = useState('swap');
  const { actor, loading: actorLoading } = useActor();
  const { authenticated, user, logout } = useAuth();

  const handleLoginSuccess = () => {
    console.log('Login successful, user authenticated');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'swap':
        return <SwapPage actor={actor} user={user} />;
      case 'orders':
        return <OrdersPage actor={actor} user={user} />;
      case 'history':
        return <HistoryPage actor={actor} user={user} />;
      default:
        return <SwapPage actor={actor} user={user} />;
    }
  };

  if (actorLoading) {
    return (
      <div className="h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Initializing Ionic Swap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-900 flex flex-col relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large centered logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src="/logo.svg" 
            alt="Background Logo" 
            className="w-[500px] h-[500px] opacity-5"
          />
        </div>
        
        {/* Blurred cycles on left and right */}
        <div className="absolute left-0 top-1/4 w-64 h-64 bg-neutral-700 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute left-0 bottom-1/4 w-48 h-48 bg-neutral-600 rounded-full blur-3xl opacity-15"></div>
        <div className="absolute right-0 top-1/3 w-56 h-56 bg-neutral-700 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute right-0 bottom-1/3 w-40 h-40 bg-neutral-600 rounded-full blur-3xl opacity-15"></div>
      </div>

      {!authenticated ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <Header 
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            user={user}
            onLogout={logout}
          />
          
          <main className="flex-1 overflow-auto relative z-10">
            {renderPage()}
          </main>
          
          <Footer />
        </>
      )}
    </div>
  );
}

export default App; 