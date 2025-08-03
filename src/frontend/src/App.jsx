import { useState } from 'react';
import { useActor } from './useActor';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import SwapPage from './pages/SwapPage';
import OrdersPage from './pages/OrdersPage';
import HistoryPage from './pages/HistoryPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('swap');
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const { actor, loading: actorLoading } = useActor();

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setUserAddress(accounts[0]);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'swap':
        return <SwapPage actor={actor} userAddress={userAddress} />;
      case 'orders':
        return <OrdersPage actor={actor} userAddress={userAddress} />;
      case 'history':
        return <HistoryPage actor={actor} userAddress={userAddress} />;
      default:
        return <SwapPage actor={actor} userAddress={userAddress} />;
    }
  };

  if (actorLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Initializing Ionic Swap...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isConnected={isConnected}
        userAddress={userAddress}
        onConnectWallet={connectWallet}
      />
      
      <main className="main-content">
        {!isConnected ? (
          <div className="connect-prompt">
            <div className="connect-card">
              <h2>Welcome to Ionic Swap</h2>
              <p>Connect your wallet to start swapping between EVM and ICP</p>
              <button onClick={connectWallet} className="connect-btn">
                Connect MetaMask
              </button>
            </div>
          </div>
        ) : (
          renderPage()
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App; 