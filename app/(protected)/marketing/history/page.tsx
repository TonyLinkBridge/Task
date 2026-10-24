import { redirect } from 'next/navigation';
import { retrySlackDelivery } from '@/features/admin/actions/retry-slack-delivery';
import { AuditLog } from '@/features/admin/components/audit-log';
import { DeliveryLog } from '@/features/admin/components/delivery-log';
import { adminRepository } from '@/features/admin/repository';
import { MarketingShell } from '@/features/marketing/components/shell';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';

export default async function MarketingHistoryPage() {
  const currentUser = await getVerifiedUser();
  if (currentUser.role !== 'admin') redirect('/access-denied?reason=admin-only');
  const [deliveries, events] = await Promise.all([
    adminRepository.listSlackDeliveries(), adminRepository.listAuditEvents(),
  ]);
  return <MarketingShell currentUser={currentUser} active="history" title="历史记录" description="查看重要操作和 Slack 发送情况，所有时间使用马来西亚时间。">
    <div className="marketing-entry marketing-history">
      <DeliveryLog deliveries={deliveries} retryAction={retrySlackDelivery} />
      <AuditLog events={events} />
    </div>
  </MarketingShell>;
}
