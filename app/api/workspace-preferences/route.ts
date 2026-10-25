import {loadWorkspacePreferences} from '@/features/workspace-settings/actions';
export async function GET(){try{return Response.json(await loadWorkspacePreferences(),{headers:{'Cache-Control':'private, no-store'}});}catch{return Response.json({message:'WORKSPACE_UNAVAILABLE'},{status:503,headers:{'Cache-Control':'private, no-store'}});}}
