import { useState } from 'react';
import { useActor } from './useActor';
import { useAuth } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import SwapPage from './pages/SwapPage';
import OrdersPage from './pages/OrdersPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  const [currentPage, setCurrentPage] = useState('swap');
  const { actor, loading: actorLoading } = useActor();
  const { authenticated, user, logout } = useAuth();

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
      <div className="h-screen bg-gradient-to-br from-[#1A1A33] to-[#2A2A4A] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Initializing Ionic Swap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#1A1A33] via-[#1E1E3F] to-[#2A2A4A] flex flex-col relative">
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
        
        {/* Blurred cycles with new color palette */}
        <div className="absolute left-0 top-1/4 w-128 h-128 bg-gradient-to-br from-[#80B3FF] to-[#C080FF] rounded-full blur-[100px] opacity-[0.2]"></div>
        <div className="absolute left-0 bottom-1/4 w-96 h-96 bg-gradient-to-br from-[#C080FF] to-[#D090FF] rounded-full blur-[100px] opacity-[0.204]"></div>
        <div className="absolute right-0 top-1/3 w-112 h-112 bg-gradient-to-br from-[#70A0FF] to-[#B070FF] rounded-full blur-[100px] opacity-[0.205]"></div>
        <div className="absolute right-0 bottom-1/3 w-80 h-80 bg-gradient-to-br from-[#90C0FF] to-[#E0A0FF] rounded-full blur-[100px] opacity-[0.204]"></div>
      </div>

      <Header 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        user={user}
        onLogout={logout}
        authenticated={authenticated}
      />
      
      <main className="flex-1 overflow-auto relative z-10">
        {renderPage()}
      </main>
      
      <Footer />
    </div>
  );
}

export default App; 