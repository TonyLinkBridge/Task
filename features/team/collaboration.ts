import type {RoomPermissions} from '@liveblocks/node';
import type {Permission} from './permissions';
export type CollaborationMember={id:string;permissions:Permission[];status:string};
export function collaborationPermissions(member:CollaborationMember,editable:boolean):RoomPermissions{
 if(member.status!=='active')return [];
 // Active members retain the existing shared workspace read access.
 if(editable&&member.permissions.includes('content.write'))return ['*:write'];
 return member.permissions.some(p=>['content.write','content.approve'].includes(p))?['*:read','comments:write']:['*:read'];
}
