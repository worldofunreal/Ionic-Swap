import { useState } from 'react';
import { useActor } from './useActor';

function App() {
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(false);
  const { actor, loading: actorLoading } = useActor();

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!actor) {
      setGreeting("Actor not initialized. Please check your connection.");
      return;
    }
    
    setLoading(true);
    try {
      const name = event.target.elements.name.value;
      const result = await actor.greet(name);
      setGreeting(result);
    } catch (error) {
      console.error("Error:", error);
      setGreeting("Failed to fetch greeting. Please ensure the canister is deployed.");
    } finally {
      setLoading(false);
    }
  };

  if (actorLoading) {
    return (
      <main>
        <img src="/logo2.svg" alt="DFINITY logo" />
        <br />
        <br />
        <div>Initializing...</div>
      </main>
    );
  }

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Enter your name: &nbsp;</label>
        <input id="name" alt="Name" type="text" disabled={loading} />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Click Me!"}
        </button>
      </form>
      <section id="greeting">{greeting}</section>
    </main>
  );
}

export default App;