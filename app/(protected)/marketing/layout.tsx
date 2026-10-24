import '@/features/marketing/marketing.css';
import { MarketingRouteTransition } from '@/features/marketing/components/route-transition';
export default function MarketingLayout({ children }: { children: React.ReactNode }) { return <MarketingRouteTransition>{children}</MarketingRouteTransition>; }
