import '@/features/marketing/marketing.css';
import{getVerifiedUser}from'@/lib/auth/get-verified-user';
import{MarketingFrame}from'@/features/marketing/components/frame';
import{MarketingRouteTransition}from'@/features/marketing/components/route-transition';
export default async function MarketingLayout({children}:{children:React.ReactNode}){const currentUser=await getVerifiedUser();return <MarketingRouteTransition><MarketingFrame currentUser={currentUser}>{children}</MarketingFrame></MarketingRouteTransition>;}
