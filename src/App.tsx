import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./features/shell/AppShell";
import { ComingSoonPage } from "./features/shell/ComingSoonPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { DepositPage } from "./features/deposit/DepositPage";
import { WithdrawPage } from "./features/withdraw/WithdrawPage";
import { SwapPage } from "./features/swap/SwapPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="earn" element={<ComingSoonPage title="Earn" />} />
          <Route path="activity" element={<ComingSoonPage title="Activity" />} />
          <Route path="deposit" element={<DepositPage />} />
          <Route path="withdraw" element={<WithdrawPage />} />
          <Route path="swap" element={<SwapPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
