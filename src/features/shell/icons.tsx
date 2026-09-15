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
