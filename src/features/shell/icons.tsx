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
