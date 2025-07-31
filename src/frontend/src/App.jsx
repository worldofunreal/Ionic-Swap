import { useState } from 'react';
import { useActor } from './useActor';
import GaslessSwap from './GaslessSwap';

function App() {
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

  if (actorLoading) {
    return (
      <main>
        <div>Initializing...</div>
      </main>
    );
  }

  return (
    <main>
      <h1>Ionic Swap</h1>
      
      {!isConnected ? (
        <div className="connect-wallet">
          <button onClick={connectWallet} className="connect-btn">
            Connect MetaMask
          </button>
        </div>
      ) : (
        <>
          <div className="wallet-info">
            <p>Connected: {userAddress}</p>
          </div>
          
          <GaslessSwap />
        </>
      )}
    </main>
  );
}

export default App;