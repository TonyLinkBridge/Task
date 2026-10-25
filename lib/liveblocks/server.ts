import "server-only";
import {getSupabaseAdmin} from "@/lib/supabase/admin";
import {collaborationPermissions,type CollaborationMember} from "@/features/team/collaboration";
import {legacyPermissions} from "@/features/team/permissions";

import { Liveblocks } from "@liveblocks/node";

import type { VerifiedUser } from "@/lib/auth/types";
import { getServerEnv } from "@/lib/env/server";
import { roomPermissions } from "@/features/content/room-permissions";

let serverClient: Liveblocks | undefined;

function getLiveblocksServer() {
  serverClient ??= new Liveblocks({ secret: getServerEnv().LIVEBLOCKS_SECRET_KEY });
  return serverClient;
}

export function getUserColor(userId: string) {
  const colors = ["#2563eb", "#7c3aed", "#059669", "#dc2626"];
  const total = [...userId].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return colors[total % colors.length];
}

export async function authorizeContentRoom(
  user: VerifiedUser,
  roomId: string,
  editable: boolean
): Promise<{ token: string }> {
  const client = getLiveblocksServer();
  const permissions = collaborationPermissions({id:user.id,status:user.teamStatus??"active",permissions:user.permissions??legacyPermissions(user.role)},editable);
  await client.upsertRoom(roomId, {
    update: { defaultAccesses: [], usersAccesses:{[user.id]:permissions} },
    create: { defaultAccesses: [], usersAccesses:{[user.id]:permissions} },
  });
  const authorization = await client.identifyUser(user.id, {
    userInfo: {
      name: user.name,
      avatar: user.imageUrl ?? "",
      role: user.role,
      color: getUserColor(user.id),
    },
  });
  if (authorization.status !== 200) {
    throw authorization.error ?? new Error("LIVEBLOCKS_AUTH_FAILED");
  }
  return JSON.parse(authorization.body) as { token: string };
}

export async function setContentRoomEditable(
  roomId: string,
  editable: boolean
): Promise<void> {
  const {data,error}=await getSupabaseAdmin().rpc("team_collaboration_members");
  if(error)throw Error("TEAM_COLLABORATION_UNAVAILABLE");
  const members=data as CollaborationMember[];
  const client=getLiveblocksServer();
  let old: Awaited<ReturnType<typeof client.getRoom>>|undefined;
  try{old=await client.getRoom(roomId);}catch(error){if(!(typeof error==='object'&&error&&'status'in error&&error.status===404))throw error;}
  const usersAccesses:Record<string,ReturnType<typeof roomPermissions>|null>={};
  for(const id of Object.keys(old?.usersAccesses??{}))usersAccesses[id]=null;
  for(const member of members)usersAccesses[member.id]=collaborationPermissions(member,editable) as ReturnType<typeof roomPermissions>;
  const groupsAccesses=Object.fromEntries(Object.keys(old?.groupsAccesses??{}).map(id=>[id,null]));
  await client.upsertRoom(roomId,{update:{defaultAccesses:[],usersAccesses,groupsAccesses},create:{defaultAccesses:[],usersAccesses:Object.fromEntries(Object.entries(usersAccesses).filter((entry): entry is [string,ReturnType<typeof roomPermissions>]=>entry[1]!==null))}});
}

export async function clearResolvedContentThreads(
  roomId: string
): Promise<number> {
  const client = getLiveblocksServer();
  const { data: threads } = await client.getThreads({
    roomId,
    query: { resolved: true },
  });
  await Promise.all(
    threads.map((thread) =>
      client.deleteThread({ roomId, threadId: thread.id })
    )
  );
  return threads.length;
}

export async function deleteContentRoom(roomId: string): Promise<void> {
  await getLiveblocksServer().deleteRoom(roomId);
}

/** Refresh room ACLs after team changes, including identities with existing ID tokens. */
export async function synchronizeTeamCollaborationAccess(){
 const db=getSupabaseAdmin();
 for(let offset=0;;offset+=100){
  const{data,error}=await db.from("contents").select("liveblocks_room_id,status").is("archived_at",null).order("id").range(offset,offset+99);
  if(error)throw Error("TEAM_COLLABORATION_UNAVAILABLE");
  const rooms=data??[];
  for(let i=0;i<rooms.length;i+=4)await Promise.all(rooms.slice(i,i+4).map(room=>setContentRoomEditable(room.liveblocks_room_id,room.status==='draft'||room.status==='changes_requested')));
  if(rooms.length<100)break;
 }
}
