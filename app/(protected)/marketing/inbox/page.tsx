import { MarketingInbox } from '@/features/marketing/components/inbox';
import { MarketingShell } from '@/features/marketing/components/shell';
import { inAppNotificationRepository } from '@/features/notifications/in-app-repository';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
export default async function MarketingInboxPage() {
  const currentUser = await getVerifiedUser();
  const notifications = await inAppNotificationRepository.list(currentUser.id);
  return <MarketingShell currentUser={currentUser} active="inbox" title="Inbox" description="查看任务分派、内容审核和发布提醒。"><MarketingInbox initialNotifications={notifications} /></MarketingShell>;
}
