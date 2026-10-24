import { describe, expect, it, vi } from 'vitest';
import { makeMarketingContentQueries } from '@/features/marketing/content-query-service';
import type { ContentRecord } from '@/features/content/types';

const id='22222222-2222-4222-8222-222222222222';
const content: ContentRecord={id,title:'待审内容',status:'in_review',authorId:'employee',assigneeId:'employee',publishAt:'2026-10-25T04:00:00Z',liveblocksRoomId:`content:${id}`,currentVersion:2,requiredApprovals:2,requestedReviewerId:null,publishedBy:null,publishedAt:null,linkedTaskId:null,archivedAt:null,createdAt:'2026-10-24T00:00:00Z',updatedAt:'2026-10-24T00:00:00Z'};
function setup() {
 const currentFiles=[{id:'current-file',mimeType:'image/png'}], fixedFiles=[{id:'submitted-file',mimeType:'image/png'}];
 const dependencies={
  getVerifiedUser:vi.fn(async()=>({id:'admin-a',role:'admin' as const,name:'上司A',imageUrl:null})),
  find:vi.fn(async()=>content),listApprovals:vi.fn(async()=>[]),listHistory:vi.fn(async()=>[]),listComments:vi.fn(async()=>[]),
  listAttachments:vi.fn(async()=>currentFiles),listPlatforms:vi.fn(async()=>[]),listPlatformIds:vi.fn(async()=>[]),listAssignees:vi.fn(async()=>[]),
  findVersion:vi.fn(async()=>[{type:'paragraph',content:'固定审核版本'}]),listVersionAttachments:vi.fn(async()=>fixedFiles),now:()=>new Date('2026-10-24T12:00:00Z'),
 };
 return {dependencies,currentFiles,fixedFiles,queries:makeMarketingContentQueries(dependencies as never)};
}
describe('marketing content queries',()=>{
 it('authenticates before any content read',async()=>{
  const {dependencies,queries}=setup();dependencies.getVerifiedUser.mockRejectedValue(Error('NOT_SIGNED_IN'));
  await expect(queries.detail(id)).rejects.toThrow('NOT_SIGNED_IN');expect(dependencies.find).not.toHaveBeenCalled();
 });
 it('loads the submitted snapshot and its files and preserves double-admin requirements',async()=>{
  const {dependencies,queries,fixedFiles}=setup(); const result=await queries.detail(id);
  expect(result?.content.requiredApprovals).toBe(2);expect(result?.snapshotDocument).toEqual([{type:'paragraph',content:'固定审核版本'}]);
  expect(result?.visibleAttachments).toEqual(fixedFiles);expect(dependencies.findVersion).toHaveBeenCalledWith(id,2);
  expect(result?.editable).toBe(false);expect(result?.currentUser.id).toBe('admin-a');
 });
 it('restores current files and editability after changes are requested',async()=>{
  const {dependencies,queries,currentFiles}=setup();dependencies.find.mockResolvedValue({...content,status:'changes_requested'});
  const result=await queries.detail(id);expect(result?.editable).toBe(true);expect(result?.visibleAttachments).toEqual(currentFiles);
 });
 it('uses the submitted cover during review, never an unsent replacement',async()=>{
  const {dependencies,queries}=setup();expect(await queries.cover(id)).toMatchObject({id:'submitted-file'});expect(dependencies.listAttachments).not.toHaveBeenCalled();
  dependencies.find.mockResolvedValue({...content,status:'changes_requested'});expect(await queries.cover(id)).toMatchObject({id:'current-file'});
 });
 it('does not expose cover files before authentication or for archived content',async()=>{
  const {dependencies,queries}=setup();dependencies.getVerifiedUser.mockRejectedValueOnce(Error('NOT_SIGNED_IN'));await expect(queries.cover(id)).rejects.toThrow('NOT_SIGNED_IN');expect(dependencies.find).not.toHaveBeenCalled();
  dependencies.find.mockResolvedValue({...content,status:'archived'});expect(await queries.cover(id)).toBeNull();expect(dependencies.listAttachments).not.toHaveBeenCalled();
 });
 it('rejects invalid, missing and archived content without creating rooms or revealing details',async()=>{
  const {dependencies,queries}=setup();expect(await queries.detail('invalid')).toBeNull();expect(dependencies.find).not.toHaveBeenCalled();
  dependencies.find.mockResolvedValue({...content,status:'archived',archivedAt:'2026-10-24T00:00:00Z'});expect(await queries.detail(id)).toBeNull();
  expect(dependencies.findVersion).not.toHaveBeenCalled();
 });
});
