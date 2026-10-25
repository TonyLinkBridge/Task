import 'server-only';
import { contentRepository } from '@/features/content/repository';
import { approvalRepository } from '@/features/approval/repository';
import { taskRepository } from '@/features/tasks/repository';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
import { makeMarketingContentQueries } from './content-query-service';

export const marketingContentQueries = makeMarketingContentQueries({
  getVerifiedUser,
  find: id => contentRepository.find(id),
  isArchived: id => contentRepository.isArchived(id),
  listApprovals: id => approvalRepository.listApprovals(id),
  listHistory: id => approvalRepository.listHistory(id),
  listComments: id => contentRepository.listComments(id),
  listAttachments: id => contentRepository.listAttachments(id),
  listPlatforms: () => contentRepository.listPlatforms(),
  listPlatformIds: id => contentRepository.listPlatformIds(id),
  listAssignees: () => taskRepository.listAssignees(),
  findVersion: (id, version) => contentRepository.findVersion(id, version),
  listVersionAttachments: (id, version) => contentRepository.listVersionAttachments(id, version),
  now: () => new Date(),
});
