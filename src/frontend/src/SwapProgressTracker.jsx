export const SwapProgressTracker = ({ 
  checkICPEscrow, 
  submitSecret,
  withdrawOnICP 
}) => {
  const [progress, setProgress] = useState({
    escrowCreated: false,
    finalityPassed: false,
    secretReady: false
  });

  useEffect(() => {
    const checkProgress = async () => {
      const escrowStatus = await checkICPEscrow();
      const finalityPassed = escrowStatus.finality_blocks > 0;
      
      setProgress({
        escrowCreated: !!escrowStatus.created,
        finalityPassed,
        secretReady: finalityPassed && !escrowStatus.secret_revealed
      });
    };
    
    const interval = setInterval(checkProgress, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="progress-tracker">
      <div className={`step ${progress.escrowCreated ? 'completed' : ''}`}>
        <span>1. Escrow Created</span>
      </div>
      <div className={`step ${progress.finalityPassed ? 'completed' : ''}`}>
        <span>2. Finality Passed</span>
      </div>
      <div className={`step ${progress.secretReady ? 'active' : ''}`}>
        {progress.secretReady ? (
          <button onClick={submitSecret}>Submit Secret</button>
        ) : (
          <span>3. Submit Secret</span>
        )}
      </div>
      <div className="step">
        <button onClick={withdrawOnICP}>Withdraw on ICP</button>
      </div>
    </div>
  );
};