'use client';
import { PrivateMessages } from '@/features/messages/components/private-messages';
import { GlobalSearch } from '@/features/search/components/global-search';
import { NotificationCenter } from '@/features/notifications/components/notification-center';
import { marketingHref } from '../page-model';
export function MarketingHeaderActions() {
  return <><span className="marketing-search-control"><GlobalSearch mapHref={marketingHref} /></span><PrivateMessages /><NotificationCenter mapHref={marketingHref} /></>;
}
