import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const DashboardIcon = () => (
  <svg {...base}>
    <path d="M8 1.4 14 8l-6 6.6L2 8z" />
  </svg>
);

export const EarnIcon = () => (
  <svg {...base}>
    <path d="M4 12 12 4M5.5 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM10.5 12.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
  </svg>
);

export const ActivityIcon = () => (
  <svg {...base}>
    <path d="M2.5 4h11M2.5 8h11M2.5 12h7" />
  </svg>
);

export const PlusIcon = () => (
  <svg {...base}>
    <path d="M8 2.5v11M2.5 8h11" />
  </svg>
);

export const DownloadIcon = () => (
  <svg {...base}>
    <path d="M8 2v8.5M4.3 7.2 8 10.9l3.7-3.7M2.5 13.5h11" />
  </svg>
);

export const SwapIcon = () => (
  <svg {...base}>
    <path d="M3 5.5h9.5M10 2.5l2.5 3-2.5 3M13 10.5H3.5M6 7.5l-2.5 3 2.5 3" />
  </svg>
);

export const BankIcon = () => (
  <svg {...base}>
    <path d="M2 6.2 8 2l6 4.2M2.8 6.6h10.4M3.4 6.6V13M6.2 6.6V13M9.8 6.6V13M12.6 6.6V13M2 13h12" />
  </svg>
);

export const CoinIcon = () => (
  <svg {...base}>
    <circle cx="8" cy="8" r="5.7" />
    <path d="M8 5v6M6.3 10.1c.15.62.83 1.05 1.7 1.05 1 0 1.7-.5 1.7-1.25 0-1.85-3.4-1.1-3.4-2.84 0-.75.7-1.25 1.7-1.25.87 0 1.55.43 1.7 1.05" />
  </svg>
);

export const CopyIcon = () => (
  <svg {...base}>
    <rect x="6" y="6" width="7.5" height="7.5" rx="1.4" />
    <path d="M3.8 10.2h-.3A1.5 1.5 0 0 1 2 8.7V3.5A1.5 1.5 0 0 1 3.5 2h5.2a1.5 1.5 0 0 1 1.5 1.5v.3" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...base} strokeWidth={1.8}>
    <path d="M3 8.5 6.3 12 13 3.8" />
  </svg>
);

export const ChevronLeftIcon = () => (
  <svg {...base}>
    <path d="M10 3 5 8l5 5" />
  </svg>
);

export const CloseIcon = () => (
  <svg {...base}>
    <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" />
  </svg>
);
