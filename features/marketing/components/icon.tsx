import type { SVGProps } from 'react';
/** SVG geometry from the preserved Murmura demo. See preview/murmura/THIRD_PARTY_NOTICES.md. */
const shapes = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  library: <><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="9.5" r="1.8" /><path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4" /></>,
  channels: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  team: <><path d="M12 3.5 5 6v5.5c0 4.4 3 7.9 7 9 4-1.1 7-4.6 7-9V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.8l2 2.1 2.9-.4.7 2.8 2.6 1.4-1 2.8 1 2.8-2.6 1.4-.7 2.8-2.9-.4-2 2.1-2-2.1-2.9.4-.7-2.8-2.6-1.4 1-2.8-1-2.8 2.6-1.4.7-2.8 2.9.4Z" /></>,
  more: <><circle cx="5.5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18.5" cy="12" r="1.3" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="3" /><path d="M7 3v4m10-4v4M4 10h16" /></>,
  home: <><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M9 21v-9h6v9" /></>,
  inbox: <><path d="M4 4h16v16H4zM4 13h5l2 3h2l2-3h5" /></>,
  tasks: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="m7 9 1 1 2-2m3 1h4m-10 6 1 1 2-2m3 1h4" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 2m0 3h.01" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  check: <path d="m5 12 4 4L19 6" />,
} satisfies Record<string, React.ReactNode>;
export type MarketingIconName = keyof typeof shapes;
export function MarketingIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: MarketingIconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{shapes[name]}</svg>;
}
