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
    <div className="h-screen bg-neutral-900 flex flex-col">
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
          
          <main className="flex-1 overflow-auto">
            {renderPage()}
          </main>
          
          <Footer />
        </>
      )}
    </div>
  );
}

export default App; 