// Updates source files in existing disposable previews. Never copies environment/config credentials.
import{readFile,writeFile,cp,mkdir,stat}from'node:fs/promises';
import{resolve,dirname}from'node:path';
import{marketingRuntimeSource}from'./marketing-runtime-source.mjs';
const source=resolve(import.meta.dirname,'..');
async function changed(from,to){if((await stat(from)).isDirectory())return true;try{return !(await readFile(from)).equals(await readFile(to));}catch{return true;}}
async function putChanged(path,content){try{if(await readFile(path,'utf8')===content)return;}catch{}await writeFile(path,content);}
for(const name of['current.json','current-real.json']){
 const metadata=JSON.parse(await readFile(resolve(source,'.isolated/marketing',name),'utf8'));
 const root=resolve(metadata.root);
 if(!root.startsWith(resolve(source,'.isolated/marketing/web')+'/'))throw Error('DISPOSABLE_PREVIEW_REQUIRED');
 for(const path of['app/page.tsx','app/login','app/access-denied/page.tsx','lib/auth/redirect.ts','lib/navigation','app/(protected)/dashboard/page.tsx','app/(protected)/tasks/page.tsx','app/(protected)/content/page.tsx','app/(protected)/content/new/page.tsx','app/(protected)/content/[contentId]/page.tsx','app/(protected)/admin/settings/page.tsx','app/(protected)/admin/history/page.tsx','features/media-library','features/content/files','app/api/media-assets','supabase/migrations/20261025051526_media_asset_library.sql','components/arc','components/ui/select.tsx','components/ui/project-select.tsx','features/help-center/components/help-chrome.tsx','features/help-center/gitbook/scroll-to-top.tsx','features/help-center/gitbook/table-of-contents.tsx','features/help-center/gitbook/mobile-navigation.tsx','app/(protected)/help/layout.tsx','features/content/components/content-form.tsx','features/tasks/components/task-form.tsx','features/approval/components/review-actions.tsx','features/admin/components/slack-settings-form.tsx','features/messages/components/private-messages.tsx','features/schedule/components/schedule-filters.tsx','features/schedule/components/content-board.tsx','public/marketing-assets','public/mascots/chiikawa-peek.png','features/marketing','app/(protected)/marketing','app/(protected)/tasks/[taskId]/page.tsx','features/tasks/components/archive-task-button.tsx','features/tasks/components/delete-task-button.tsx','features/search/components/global-search.tsx','features/notifications/components/notification-center.tsx','features/notifications/read-state-events.ts','features/content/components/delete-content-button.tsx','features/content/components/attachments.tsx','components/tasks/tasks-main.tsx','features/tasks/components/task-filters.tsx','features/tasks/components/task-board.tsx']){
  await mkdir(dirname(resolve(root,path)),{recursive:true});await cp(resolve(source,path),resolve(root,path),{recursive:true,filter:changed});
 }
 await cp(resolve(source,'tests/marketing/runtime/local-database.mjs'),resolve(root,'lib/marketing-test/local-database.mjs'),{filter:changed});
 const runtimePath=resolve(root,'lib/marketing-test/runtime.ts');
 await putChanged(runtimePath,marketingRuntimeSource(metadata.realLogin));
 const browserPath=resolve(root,'lib/supabase/browser.ts');
 await putChanged(browserPath,(await readFile(browserPath,'utf8')).replace("bucket!=='content-files'","!['content-files','task-files'].includes(bucket)"));
 if(!metadata.realLogin){
  const proxyPath=resolve(root,'proxy.ts');const original=await readFile(proxyPath,'utf8');if(!original.includes("'/api/search'"))await putChanged(proxyPath,original.replace("'/api/files/'","'/api/files/','/api/task-files/','/api/search','/api/notifications','/tasks','/help'"));
  const proxyUpdated=await readFile(proxyPath,'utf8');if(!proxyUpdated.includes("'/api/messages'"))await putChanged(proxyPath,proxyUpdated.replace("'/api/notifications'","'/api/notifications','/api/messages'"));
 }
 const isolatedProxyPath=resolve(root,'proxy.ts');
 if(!metadata.realLogin){const proxy=await readFile(isolatedProxyPath,'utf8');await putChanged(isolatedProxyPath,proxy.includes("'/api/media-assets/'")?proxy:proxy.replace("'/api/files/'","'/api/files/','/api/media-assets/'"));}
 if(!metadata.realLogin){
  let proxy=await readFile(isolatedProxyPath,'utf8');
  if(!proxy.includes("path!=='/'&&"))proxy=proxy.replace("!['/marketing'", "path!=='/'&&!['/marketing'");
  if(!proxy.includes("'/dashboard'"))proxy=proxy.replace("'/marketing-test'", "'/marketing-test','/dashboard','/content','/admin'");
  await putChanged(isolatedProxyPath,proxy);
 }

 console.log('Updated isolated preview on port',metadata.realLogin?3219:3218);
}
