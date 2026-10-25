import {hasPermission} from "@/features/team/permissions";
import { listAvailableMedia,useMediaInContent } from '@/features/media-library/actions';
import { ReviewHistory } from '@/features/approval/components/review-history';
import { MarketingEditorReview } from './editor-review';
import { ContentRoom } from '@/features/content/components/content-room';
import { ContentChat } from '@/features/content/components/content-chat';
import { ContentScheduleEditor } from '@/features/content/components/content-schedule-editor';
import { Attachments } from '@/features/content/components/attachments';
import { canEditContentSchedule } from '@/features/content/schedule-edit-permission';
import { addContentComment, refreshContentComments } from '@/features/content/actions/comments';
import { updateScheduledContent } from '@/features/content/actions/content';
import { requestUpload, finishUpload } from '@/features/content/files/actions';
import type { MarketingContentDetailData } from '../content-query-service';
import { MarketingCollaborationGuard } from './collaboration-guard';
import { MarketingRoomPermissionSync } from './room-permission-sync';

export function MarketingContentWorkspace({ detail }: { detail: MarketingContentDetailData }) {
  const { content, currentUser, approvals, snapshotDocument, assignees } = detail;
  return (
    <div className="marketing-workspace">
      <div className="marketing-workspace-main">
        {canEditContentSchedule(content, currentUser) ? (
          <ContentScheduleEditor content={content} platformIds={detail.platformIds} platforms={detail.platforms}
            assignees={assignees} updateAction={updateScheduledContent} />
        ) : null}
        <ContentRoom key={`${content.id}:${currentUser.id}:${detail.editable ? 'editing' : 'review'}`} contentId={content.id}>
          <MarketingRoomPermissionSync editable={detail.editable}>
          <MarketingCollaborationGuard>
          <MarketingEditorReview content={content} currentUser={currentUser} approvals={approvals}
            admins={assignees.filter(member => hasPermission(member,'content.approve'))} snapshotDocument={snapshotDocument} />
          </MarketingCollaborationGuard>
          </MarketingRoomPermissionSync>
        </ContentRoom>
        <ContentChat contentId={content.id} comments={detail.comments} currentUser={currentUser}
          addCommentAction={addContentComment} refreshCommentsAction={refreshContentComments} />
      </div>
      <aside className="marketing-workspace-aside" aria-label="文件与审核记录">
        <Attachments key={`${content.id}:${content.currentVersion}:${content.status}`} contentId={content.id}
          attachments={detail.visibleAttachments} editable={detail.editable}
          requestUploadAction={requestUpload} finishUploadAction={finishUpload} listMediaAction={listAvailableMedia} useMediaAction={useMediaInContent} />
        <ReviewHistory events={detail.history} />
      </aside>
    </div>
  );
}
