import { useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeatureGrid from './components/FeatureGrid';
import ProblemSolution from './components/ProblemSolution';
import SecuritySection from './components/SecuritySection';
import PwaBanner from './components/PwaBanner';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';

export interface LandingPageProps {
  onLogin?: () => void;
  onSignUp?: () => void;
  onDemo?: () => void;
}

export function LandingPage({ onLogin, onSignUp, onDemo }: LandingPageProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    if (onLogin) onLogin();
    else navigate('/login');
  };

  const handleSignUp = () => {
    if (onSignUp) onSignUp();
    else navigate('/onboarding');
  };

  const handleDemo = () => {
    if (onDemo) {
      onDemo();
    } else {
      navigate('/onboarding?mode=demo');
    }
  };

  return (
    <div className="min-h-screen bg-white font-figtree text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
      <Navbar onLogin={handleLogin} onSignUp={handleSignUp} />
      <PageTransition>
        <Hero onSignUp={handleSignUp} onDemo={handleDemo} />
        <FeatureGrid />
        <ProblemSolution />
        <SecuritySection />
        <PwaBanner onSignUp={handleSignUp} />
      </PageTransition>
      <Footer />
    </div>
  );
}

export default LandingPage;
