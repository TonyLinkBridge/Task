import {expect,it,vi} from 'vitest';
import {makeProfileService} from '@/features/workspace-settings/profile-service';
it('gets the actor from authenticated context and rejects user-supplied authority fields',async()=>{
 const save=vi.fn().mockResolvedValue({name:'Ivy',title:'Editor',revision:1});
 const service=makeProfileService({getUser:async()=>({id:'ivy',name:'Ivy',role:'employee',imageUrl:null}),save});
 expect((await service.save({patch:{title:'Editor'},revision:0})).ok).toBe(true);
 expect(save).toHaveBeenCalledWith('ivy',{title:'Editor'},0);
 save.mockClear();
 expect((await service.save({patch:{name:'Ivy',roleId:'admin'},revision:1})).ok).toBe(false);
 expect((await service.save({patch:{name:'Ivy'},revision:1,id:'other'})).ok).toBe(false);
 expect(save).not.toHaveBeenCalled();
});
it('reports conflict and failed writes without pretending they saved',async()=>{
 const save=vi.fn().mockRejectedValue(Error('PROFILE_CONFLICT'));
 const service=makeProfileService({getUser:async()=>({id:'ivy',name:'Ivy',role:'employee',imageUrl:null}),save});
 const result=await service.save({patch:{name:'Ivy'},revision:1});
 expect(result.ok).toBe(false);if(!result.ok)expect(result.message).toContain('更新');
});
