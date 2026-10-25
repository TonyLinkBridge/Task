import {expect,it,vi} from 'vitest';
import {makeLibraryManagement} from '@/features/library-management/service';
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
it('authenticates, validates and always uses the real actor, including personal favorites',async()=>{
 const favorite=vi.fn(),save=vi.fn(),tags=vi.fn();const d={getUser:async()=>({id:'employee',role:'employee' as const,name:'Employee',imageUrl:null}),favorite,tags,save,archive:vi.fn(),use:vi.fn(),list:vi.fn(),id:()=>id};
 const s=makeLibraryManagement(d);expect((await s.favorite({ids:[id],favorite:true,actorId:'admin'})).ok).toBe(true);expect(favorite).toHaveBeenCalledWith([id],true,'employee');
 expect((await s.tags({id,tags:['x'.repeat(33)]})).ok).toBe(false);expect(tags).not.toHaveBeenCalled();
 expect((await s.save({id,kind:'template',title:'标题',body:'内容',revision:0,ownerId:'admin'})).ok).toBe(true);expect(save.mock.calls[0][1]).toBe('employee');
 const denied=makeLibraryManagement({...d,getUser:async()=>{throw Error('UNAUTHENTICATED');}});expect((await denied.favorite({ids:[id],favorite:true})).ok).toBe(false);expect(favorite).toHaveBeenCalledTimes(1);
});
it('explains revision conflicts and does not report failed writes as saved',async()=>{const fail=vi.fn(async()=>{throw Error('CONFLICT');});const s=makeLibraryManagement({getUser:async()=>({id:'employee',role:'employee',name:'Employee',imageUrl:null}),favorite:fail,tags:fail,save:fail,archive:fail,use:fail,list:fail,id:()=>id});const result=await s.save({id,kind:'template',title:'标题',body:'正文',revision:0});expect(result.ok).toBe(false);if(!result.ok)expect(result.message).toContain('同事');});
