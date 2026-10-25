'use server';
import {revalidatePath}from'next/cache';
import {getVerifiedUser}from'@/lib/auth/get-verified-user';
import {synchronizeTeamCollaborationAccess}from'@/lib/liveblocks/server';
import {teamRepository}from'./repository';
import {makeTeamService}from'./service';
import {deliverTeamInvite,revokeTeamInvite}from'./clerk-provider';
const service=makeTeamService({getUser:getVerifiedUser,snapshot:teamRepository.snapshot,mutate:teamRepository.mutate,deliver:deliverTeamInvite,revoke:revokeTeamInvite,syncAccess:synchronizeTeamCollaborationAccess});
export async function loadTeam(){return service.load();}
export async function changeTeam(operation:string,input:unknown){const result=await service.change(operation,input);revalidatePath('/marketing/team','layout');return result;}
export async function synchronizeTeam(){return service.synchronize();}
