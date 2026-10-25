import {expect,it} from 'vitest';
import {PERMISSIONS,BUILTIN_ROLES,hasPermission,legacyPermissions} from '@/features/team/permissions';
it('retains legacy administrator and employee abilities without turning employee ownership into global access',()=>{
 expect(hasPermission({role:'admin'},'team.manage')).toBe(true);
 expect(legacyPermissions('employee')).toContain('content.delete');
 expect(legacyPermissions('employee')).not.toContain('content.manage_all');
 expect(BUILTIN_ROLES.map(r=>r.id)).toEqual(['owner','admin','manager','editor','community','analyst','client']);
 expect(new Set(PERMISSIONS.map(p=>p[0])).size).toBe(PERMISSIONS.length);
});
it('explicitly empty or suspended effective permissions fail closed even with old admin metadata',()=>{
 expect(hasPermission({role:'admin',permissions:[]},'team.manage')).toBe(false);
 expect(hasPermission({role:'admin',teamStatus:'suspended'},'team.manage')).toBe(false);
 expect(hasPermission({role:'employee',permissions:['content.approve']},'content.approve')).toBe(true);
});
