import type {Permission} from '@/features/team/permissions';
export type PersonalProfile={id:string;name:string;title:string;email:string|null;photoUrl:string|null;avatarMode:'photo'|'initials';roleId:string;roleName:string;roleColor:string;permissions:Permission[];revision:number};
export type ProfilePatch=Partial<Pick<PersonalProfile,'name'|'title'|'avatarMode'>>;
