import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import {
  ActivityIcon,
  DashboardIcon,
  DownloadIcon,
  EarnIcon,
  PlusIcon,
  SwapIcon,
} from "./icons";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? styles.linkActive : styles.link;

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.mark}>E</div>
        <span className={styles.wordmark}>Embankment Pay</span>
      </div>

      <nav className={styles.nav}>
        <NavLink to="/" end className={linkClass}>
          <DashboardIcon />
          Dashboard
        </NavLink>
        <NavLink to="/earn" className={linkClass}>
          <EarnIcon />
          Earn
        </NavLink>
        <NavLink to="/activity" className={linkClass}>
          <ActivityIcon />
          Activity
        </NavLink>

        <div className={styles.navLabel}>Move money</div>
        <NavLink to="/deposit" className={linkClass}>
          <PlusIcon />
          Deposit
        </NavLink>
        <NavLink to="/withdraw" className={linkClass}>
          <DownloadIcon />
          Withdraw
        </NavLink>
        <NavLink to="/swap" className={linkClass}>
          <SwapIcon />
          Swap
        </NavLink>
      </nav>

      <div className={styles.spacer} />

      <div className={styles.profile}>
        <div className={styles.avatar}>AR</div>
        <div>
          <div className={styles.profileName}>Ana Ramos</div>
          <div className={styles.profileMeta}>
            <span className={styles.dot} />
            Base network
          </div>
        </div>
      </div>
    </aside>
  );
}
