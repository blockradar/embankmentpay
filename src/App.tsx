import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./features/shell/AppShell";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ActivityPage } from "./features/activity/ActivityPage";
import { DepositPage } from "./features/deposit/DepositPage";
import { WithdrawPage } from "./features/withdraw/WithdrawPage";
import { SwapPage } from "./features/swap/SwapPage";
import { EarnPage } from "./features/earn/EarnPage";
import { AddToEarnPage } from "./features/earn/AddToEarnPage";
import { MoveOutPage } from "./features/earn/MoveOutPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="earn" element={<EarnPage />} />
          <Route path="earn/add" element={<AddToEarnPage />} />
          <Route path="earn/withdraw" element={<MoveOutPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="deposit" element={<DepositPage />} />
          <Route path="withdraw" element={<WithdrawPage />} />
          <Route path="swap" element={<SwapPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
