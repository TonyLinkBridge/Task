import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toMarketingContent, marketingRoutes } from '../../features/marketing/task-adapter.mts';

const content = {
  id: 'content-1', title: 'Telegram 内容', status: 'in_review',
  authorId: 'writer', assigneeId: 'owner', publishAt: '2026-10-24T16:30:00Z',
  liveblocksRoomId: 'content:content-1', currentVersion: 3, requiredApprovals: 2,
  requestedReviewerId: null, publishedBy: null, publishedAt: null,
  linkedTaskId: 'task-1', archivedAt: null, createdAt: '2026-10-20T00:00:00Z', updatedAt: '2026-10-24T00:00:00Z',
};
const schedule = {
  id: content.id, title: content.title, status: 'in_review', storedStatus: 'in_review',
  publishAt: content.publishAt, assignee: { id: 'owner', name: '负责人', imageUrl: null },
  platforms: [{ id: 'custom-telegram', name: 'Telegram', color: '#00cdd9' }],
  requiredApprovals: 2, approvalAdminIds: [],
};
const approval = (adminId, overrides = {}) => ({ id: `ap-${adminId}`, contentId: content.id, version: 3, adminId, approvedAt: '2026-10-24T01:00:00Z', invalidatedAt: null, ...overrides });
const map = (overrides = {}) => toMarketingContent({ content, schedule, approvals: [], now: new Date('2026-10-24T12:00:00Z'), ...overrides });

test('mapping preserves author vs assignee, canonical IDs, version and custom platform without inventing social accounts', () => {
  const result = map();
  assert.equal(result.id, 'content-1');
  assert.equal(result.authorId, 'writer');
  assert.equal(result.assignee.id, 'owner');
  assert.equal(result.version, 3);
  assert.equal(result.body.state, 'not_loaded');
  assert.deepEqual(result.platforms[0], { id: 'custom-telegram', name: 'Telegram', color: '#00cdd9', connectionStatus: 'unknown', accountId: null });
  assert.equal(result.metrics, null);
  assert.equal(result.contentHref, '/content/content-1');
  assert.equal(result.linkedTaskHref, '/tasks/task-1');
});
test('only unique active approvals for this content and version count toward two-admin approval', () => {
  const result = map({ approvals: [approval('admin-a'), approval('admin-a'), approval('old', {version:2}), approval('revoked', {invalidatedAt:'2026-10-24T02:00:00Z'}), approval('other', {contentId:'different'})] });
  assert.equal(result.approval.count, 1);
  assert.equal(result.approval.required, 2);
  assert.equal(result.approval.remaining, 1);
  assert.equal(result.approval.complete, false);
  assert.equal(map({ approvals: [approval('admin-a'), approval('admin-b')] }).approval.complete, true);
});
test('an overdue review is still in review; only approved content becomes due and never auto-published', () => {
  assert.equal(map({ now: new Date('2026-10-26T00:00:00Z') }).status, 'in_review');
  const result = map({ content: {...content,status:'approved'}, schedule: {...schedule,status:'approved',storedStatus:'approved'}, now:new Date('2026-10-26T00:00:00Z') });
  assert.equal(result.status, 'due');
  assert.equal(result.storedStatus, 'approved');
  assert.equal(result.publishedAt, null);
});
test('schedule fields use Malaysia time even across midnight, without rewriting stored instant', () => {
  const result=map();
  assert.equal(result.publishAt, '2026-10-24T16:30:00Z');
  assert.equal(result.localDate, '2026-10-25');
  assert.equal(result.localTime, '00:30');
  assert.equal(result.timeZone, 'Asia/Kuala_Lumpur');
});
test('incoherent snapshots and invalid dates are rejected rather than showing wrong status or time', () => {
  assert.throws(()=>map({schedule:{...schedule,id:'other'}}), /INCOHERENT_MARKETING_SNAPSHOT/);
  assert.throws(()=>map({schedule:{...schedule,storedStatus:'approved'}}), /INCOHERENT_MARKETING_SNAPSHOT/);
  assert.throws(()=>map({content:{...content,publishAt:'invalid'}}), /INVALID_MARKETING_DATE/);
});
test('archived content is excluded and every route stays inside Task', () => {
  assert.equal(map({content:{...content,status:'archived'}}),null);
  for (const href of Object.values(marketingRoutes)) assert.match(href,/^\/(?!\/)/);
  assert.equal(marketingRoutes.tasks,'/tasks');
  assert.equal(marketingRoutes.help,'/help');
  assert.equal(map({content:{...content,id:'bad/id'},schedule:{...schedule,id:'bad/id'}}).contentHref,'/content/bad%2Fid');
});
