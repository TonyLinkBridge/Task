// Match Next's production-build constraint: the first argument is a props
// object, even when its searchParams field is absent. The whole argument
// must not include undefined (default argument syntax introduces that union).
import type Tasks from '@/app/(protected)/tasks/page';
import type Dashboard from '@/app/(protected)/dashboard/page';
import type Content from '@/app/(protected)/content/page';
import type NewContent from '@/app/(protected)/content/new/page';
import type { WorkspaceSearchParams } from '@/lib/navigation/workspace-href';

type FrameworkPageProps = { searchParams?: Promise<WorkspaceSearchParams> };
type MustBePageProps<T extends FrameworkPageProps> = T;
export type LegacyPagePropsContract = [
  MustBePageProps<Parameters<typeof Tasks>[0]>,
  MustBePageProps<Parameters<typeof Dashboard>[0]>,
  MustBePageProps<Parameters<typeof Content>[0]>,
  MustBePageProps<Parameters<typeof NewContent>[0]>,
];
