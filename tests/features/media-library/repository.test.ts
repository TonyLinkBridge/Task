import {it,expect,vi} from 'vitest';
const calls=vi.hoisted(()=>({range:vi.fn()}));
vi.mock('@/lib/supabase/admin',()=>({getSupabaseAdmin:()=>({from:()=>({select:()=>({order:()=>({order:()=>({range:calls.range})})})})})}));
import {mediaRepository} from '@/features/media-library/repository';
it('loads past the database row limit instead of silently losing older assets',async()=>{const row={id:'one',storage_path:'library/one',file_name:'one.png',mime_type:'image/png',byte_size:1,uploader_id:'me',created_at:'now',archived_at:null};calls.range.mockResolvedValueOnce({data:Array.from({length:100},(_,i)=>({...row,id:String(i)})),error:null}).mockResolvedValueOnce({data:[{...row,id:'older'}],error:null});expect(await mediaRepository.list()).toHaveLength(101);expect(calls.range).toHaveBeenNthCalledWith(2,100,199);});
