import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ScamAnalyzer from './pages/ScamAnalyzer';
import ReportHistory from './pages/ReportHistory';
import AboutPage from './pages/AboutPage';
import ChatAssistant from './components/ChatAssistant';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-bg-primary text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analyzer" element={<ScamAnalyzer />} />
          <Route path="/reports" element={<ReportHistory />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
        <ChatAssistant />
      </div>
    </Router>
  );
}

export default App;
