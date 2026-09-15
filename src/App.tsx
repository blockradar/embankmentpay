import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./features/shell/AppShell";
import { ComingSoonPage } from "./features/shell/ComingSoonPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { DepositPage } from "./features/deposit/DepositPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="earn" element={<ComingSoonPage title="Earn" />} />
          <Route path="activity" element={<ComingSoonPage title="Activity" />} />
          <Route path="deposit" element={<DepositPage />} />
          <Route path="withdraw" element={<ComingSoonPage title="Withdraw" />} />
          <Route path="swap" element={<ComingSoonPage title="Swap" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
