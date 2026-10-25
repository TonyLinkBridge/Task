import {hasPermission} from "@/features/team/permissions";
import { redirect } from 'next/navigation';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';

export default async function AdminHistoryPage() {
  const currentUser = await getVerifiedUser();
  if (!hasPermission(currentUser,'history.view')) redirect('/access-denied?reason=admin-only');
  redirect('/marketing/history');
}
