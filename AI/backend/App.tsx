import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import InsightsDashboard from "./components/InsightsDashboard";
import AIInteraction from "./components/AIInteraction";
import NotificationManager from "./components/NotificationManager";

function App() {
  return (
    <Router>
      <NotificationManager />
      <div className="p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/insights" element={<InsightsDashboard />} />
          <Route path="/lola" element={<AIInteraction />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
