import { redirect } from 'next/navigation';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';

export default async function AdminHistoryPage() {
  const currentUser = await getVerifiedUser();
  if (currentUser.role !== 'admin') redirect('/access-denied?reason=admin-only');
  redirect('/marketing/history');
}
