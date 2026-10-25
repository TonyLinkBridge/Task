import type {Permission} from './permissions';
export type TeamRole={id:string;name:string;description:string;color:string;permissions:Permission[];builtIn:boolean;revision:number};
export type TeamMember={id:string;name:string;imageUrl:string|null;email:string|null;title:string;roleId:string;status:'active'|'suspended'|'removed';revision:number;joinedAt:string;lastActiveAt:string|null;mfaEnabled:boolean|null};
export type TeamInvite={id:string;name:string;email:string;roleId:string;status:'pending'|'accepted'|'revoked'|'failed';expiresAt:string;sentAt:string|null;deliveryId:string|null;revision:number};
export type TeamEvent={id:string;actorId:string;actorName:string;action:string;entityId:string;details:Record<string,unknown>;createdAt:string};
export type TeamSnapshot={generatedAt?:string;roles:TeamRole[];members:TeamMember[];invites:TeamInvite[];events:TeamEvent[]};
export type TeamResult={ok:true;data:TeamSnapshot}|{ok:false;message:string;data?:TeamSnapshot};
