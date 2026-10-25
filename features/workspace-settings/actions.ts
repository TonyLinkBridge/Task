'use server';
import {revalidatePath} from 'next/cache';
import {getVerifiedUser} from '@/lib/auth/get-verified-user';
import {makeWorkspaceSettings} from './service';
import {workspaceRepository} from './repository';
const service=makeWorkspaceSettings({getUser:getVerifiedUser,...workspaceRepository});
export async function saveWorkspacePreferences(input:unknown){const r=await service.save(input);if(r.ok)revalidatePath('/marketing/settings/workspace');return r;}
export async function loadWorkspacePreferences(){return service.load();}
