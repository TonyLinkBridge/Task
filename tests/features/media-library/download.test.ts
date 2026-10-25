import {describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({user:vi.fn(),find:vi.fn(),signed:vi.fn()}));
vi.mock('@/lib/auth/get-verified-user',()=>({getVerifiedUser:mocks.user}));
vi.mock('@/features/media-library/repository',()=>({mediaRepository:{find:mocks.find}}));
vi.mock('@/lib/supabase/admin',()=>({getSupabaseAdmin:()=>({storage:{from:()=>({createSignedUrl:mocks.signed})}})}));
import {GET} from '@/app/api/media-assets/[attachmentId]/route';
const ctx={params:Promise.resolve({attachmentId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'})};
describe('private library file access',()=>{
 it('requires a verified login before signing any file',async()=>{mocks.user.mockRejectedValueOnce(Error('unauthenticated'));expect((await GET(new Request('http://local/api/media-assets/x'),ctx)).status).toBe(403);expect(mocks.signed).not.toHaveBeenCalled();});
 it('does not sign an archived asset',async()=>{mocks.user.mockResolvedValue({id:'me'});mocks.find.mockResolvedValueOnce({storagePath:'library/file',archivedAt:'now'});expect((await GET(new Request('http://local/api/media-assets/x'),ctx)).status).toBe(404);});
 it('signs previews for 60 seconds and prevents redirect caching',async()=>{mocks.find.mockResolvedValueOnce({storagePath:'library/file',archivedAt:null});mocks.signed.mockResolvedValueOnce({data:{signedUrl:'/private-file'},error:null});const r=await GET(new Request('http://local/api/media-assets/x?mode=preview'),ctx);expect(r.status).toBe(302);expect(r.headers.get('cache-control')).toBe('no-store');expect(mocks.signed).toHaveBeenCalledWith('library/file',60,undefined);});
});
it('returns a retryable response when private storage is unavailable',async()=>{mocks.user.mockResolvedValue({id:'me'});mocks.find.mockResolvedValueOnce({storagePath:'library/file',archivedAt:null});mocks.signed.mockResolvedValueOnce({data:null,error:{message:'transient'}});expect((await GET(new Request('http://local/api/media-assets/x'),ctx)).status).toBe(503);});
