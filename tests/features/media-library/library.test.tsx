import {render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe,it,expect,vi} from 'vitest';
import type {MediaAsset} from '@/features/media-library/types';
vi.mock('@/features/media-library/components/upload',()=>({MediaUpload:({save}:{save:(file:File,meta:unknown,options:unknown)=>Promise<void>})=><button onClick={()=>void save(new File(['pic'],'new.png',{type:'image/png'}),{name:'new.png',type:'image/png',size:3},{signal:new AbortController().signal,onProgress:vi.fn()})}>模拟文件选择</button>,uploadSignedFile:vi.fn(async()=>{})}));
import {MediaLibrary} from '@/features/media-library/components/library';
const asset:MediaAsset={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',fileName:'old.png',mimeType:'image/png',byteSize:3,uploaderId:'me',storagePath:'library/me/a',createdAt:'2026-10-25T00:00:00Z',archivedAt:null};
describe('library host state',()=>{
 it('does not revive an archived asset after another upload',async()=>{render(<MediaLibrary assets={[asset]} userId="me" admin={false} requestAction={async()=>({ok:true,data:{assetId:'new',storagePath:'new',signedUrl:'/upload',token:'token'}})} finishAction={async()=>({ok:true,data:{...asset,id:'new',fileName:'new.png'}})} archiveAction={async()=>({ok:true,data:{...asset,archivedAt:'2026-10-25T01:00:00Z'}})}/>);
  await userEvent.click(within(screen.getByRole('article',{name:'素材 old.png'})).getByRole('button',{name:'从素材库移除'}));
  await waitFor(()=>expect(screen.queryByRole('article',{name:'素材 old.png'})).not.toBeInTheDocument());
  await userEvent.click(screen.getByRole('button',{name:'模拟文件选择'}));await screen.findByRole('article',{name:'素材 new.png'});
  expect(screen.queryByRole('article',{name:'素材 old.png'})).not.toBeInTheDocument();
 });
 it('does not display another person’s management action to employees',()=>{render(<MediaLibrary assets={[asset]} userId="other" admin={false} requestAction={vi.fn()} finishAction={vi.fn()} archiveAction={vi.fn()}/>);expect(screen.queryByRole('button',{name:'从素材库移除'})).not.toBeInTheDocument();});
});
