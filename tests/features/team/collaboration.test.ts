import {expect,it}from'vitest';
import {collaborationPermissions}from'@/features/team/collaboration';
it('never makes the draft writable for a reader or a suspended writer',()=>{
 expect(collaborationPermissions({id:'a',status:'active',permissions:['reports.view']},true)).toEqual(['*:read']);
 expect(collaborationPermissions({id:'a',status:'suspended',permissions:['content.write']},true)).toEqual([]);
 expect(collaborationPermissions({id:'a',status:'active',permissions:['content.approve']},true)).toEqual(['*:read','comments:write']);
 expect(collaborationPermissions({id:'a',status:'active',permissions:['content.write']},false)).toEqual(['*:read','comments:write']);
});
