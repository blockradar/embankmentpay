import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./features/shell/AppShell";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ActivityPage } from "./features/activity/ActivityPage";
import { DepositPage } from "./features/deposit/DepositPage";
import { WithdrawPage } from "./features/withdraw/WithdrawPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="deposit" element={<DepositPage />} />
          <Route path="withdraw" element={<WithdrawPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
