import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./landing/LandingPage";
import { DappPage } from "./DappPage";
import { WalletPage } from "./WalletPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<DappPage />} />
      <Route path="/wallet" element={<WalletPage />} />
    </Routes>
  );
}

export default App;
