'use server';
import {revalidatePath} from 'next/cache';
import {getVerifiedUser} from '@/lib/auth/get-verified-user';
import {makeProfileService} from './profile-service';
import {profileRepository} from './profile-repository';
const service=makeProfileService({getUser:getVerifiedUser,save:profileRepository.save});
export async function savePersonalProfile(input:unknown){const result=await service.save(input);if(result.ok)revalidatePath('/marketing','layout');return result;}
export async function loadPersonalProfile(){const user=await getVerifiedUser();return profileRepository.load(user.id);}
