import { describe,it,expect,vi } from 'vitest';
import { makeMediaLibraryActions, MediaAttachRejected } from '@/features/media-library/service';
const assetId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',contentId='22222222-2222-4222-8222-222222222222';
const meta={name:'photo.png',type:'image/png',size:12};
function harness(){
 const user={id:'employee',role:'employee' as 'employee'|'admin',name:'Employee',imageUrl:null};
 const asset={id:assetId,fileName:meta.name,mimeType:meta.type,byteSize:12,uploaderId:'employee',storagePath:`library/employee/${assetId}/source.png`,createdAt:'2026-10-25T00:00:00Z',archivedAt:null as string|null};
 const content={id:contentId,status:'draft' as 'draft'|'in_review',authorId:'employee',assigneeId:'employee'};
 const deps={getUser:async()=>user,find:vi.fn(async()=>asset),save:vi.fn(async()=>asset),archive:vi.fn(async()=>asset),createUploadUrl:vi.fn(async()=>({token:'token',signedUrl:'/local-upload'})),inspect:vi.fn(async()=>({size:12,type:'image/png'})),findContent:vi.fn(async()=>content),copy:vi.fn(async()=>{}),remove:vi.fn(async()=>{}),attach:vi.fn(async()=>({id:'attachment',contentId,storagePath:contentId+'/copy.png',fileName:meta.name,mimeType:meta.type,byteSize:12,uploaderId:'employee',createdAt:'2026-10-25T00:00:00Z'})),id:()=>assetId,now:()=>new Date('2026-10-25T00:00:00Z')};
 return {actions:makeMediaLibraryActions(deps),deps,user,asset,content};
}
describe('independent media library',()=>{
 it('creates a personal signed path and rejects executable files',async()=>{const {actions,deps}=harness();expect((await actions.request(meta)).ok).toBe(true);expect(deps.createUploadUrl).toHaveBeenCalledWith(expect.stringContaining('library/employee/'+assetId+'/'));expect((await actions.request({...meta,type:'application/x-msdownload'})).ok).toBe(false);});
 it('does not let employees archive someone else’s upload',async()=>{const {actions,deps,asset}=harness();asset.uploaderId='other';expect((await actions.setArchived(assetId,true)).ok).toBe(false);expect(deps.archive).not.toHaveBeenCalled();});
 it('lets an administrator archive and restore any asset',async()=>{const {actions,user,asset,deps}=harness();user.role='admin';asset.uploaderId='other';expect((await actions.setArchived(assetId,true)).ok).toBe(true);expect((await actions.setArchived(assetId,false)).ok).toBe(true);expect(deps.archive).toHaveBeenCalledTimes(2);});
 it('rejects another uploader’s path and inspects actual bytes before saving',async()=>{const {actions,deps}=harness();expect((await actions.finish(assetId,'library/other/'+assetId+'/photo.png',meta)).ok).toBe(false);expect(deps.inspect).not.toHaveBeenCalled();deps.find.mockResolvedValueOnce(null as never);expect((await actions.finish(assetId,'library/employee/'+assetId+'/photo.png',meta)).ok).toBe(true);expect(deps.inspect).toHaveBeenCalledOnce();expect(deps.save).toHaveBeenCalledOnce();});
 it('blocks reuse into locked or unrelated content before copying',async()=>{const {actions,content,deps}=harness();content.status='in_review';expect((await actions.useInContent(assetId,contentId)).ok).toBe(false);content.status='draft';content.authorId='other';content.assigneeId='other';expect((await actions.useInContent(assetId,contentId)).ok).toBe(false);expect(deps.copy).not.toHaveBeenCalled();});
 it('copies into the content folder and cleans up a copy when final validation fails',async()=>{const {actions,deps}=harness();deps.attach.mockRejectedValueOnce(new MediaAttachRejected());expect((await actions.useInContent(assetId,contentId)).ok).toBe(false);expect(deps.copy).toHaveBeenCalledOnce();expect(deps.remove).toHaveBeenCalledOnce();});
});

it('keeps a possibly committed copy when the RPC response is lost',async()=>{const {actions,deps}=harness();deps.attach.mockRejectedValueOnce(Error('network timeout after commit'));expect((await actions.useInContent(assetId,contentId)).ok).toBe(false);expect(deps.copy).toHaveBeenCalledOnce();expect(deps.remove).not.toHaveBeenCalled();});
