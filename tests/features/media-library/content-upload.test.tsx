import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe,it,expect,vi} from 'vitest';
vi.mock('@/features/content/files/upload-signed-file',()=>({uploadSignedFile:vi.fn(async()=>{})}));
import {uploadSignedFile} from '@/features/content/files/upload-signed-file';
import {Attachments} from '@/features/content/components/attachments';
describe('Arc connected content uploader',()=>{
 it('retries saving an already transferred file without uploading it twice',async()=>{
  const request=vi.fn(async()=>({ok:true as const,data:{storagePath:'content/photo.png',token:'secret',signedUrl:'/local-signed-upload'}}));
  const attachment={id:'attachment',contentId:'content',storagePath:'content/photo.png',fileName:'photo.png',mimeType:'image/png',byteSize:4,uploaderId:'me',createdAt:'now'};
  const finish=vi.fn().mockResolvedValueOnce({ok:false,message:'保存超时，请重试。'}).mockResolvedValueOnce({ok:true,data:attachment});
  render(<Attachments contentId="content" attachments={[]} requestUploadAction={request} finishUploadAction={finish}/>);
  await userEvent.upload(document.querySelector('input[type=file]') as HTMLInputElement,new File(['test'],'photo.png',{type:'image/png'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('保存超时，请重试。');await userEvent.click(screen.getByRole('button',{name:'Retry photo.png'}));
  await screen.findByRole('button',{name:'预览 photo.png'});expect(request).toHaveBeenCalledTimes(1);expect(uploadSignedFile).toHaveBeenCalledTimes(1);expect(finish).toHaveBeenCalledTimes(2);
 });
 it('adds a selected library attachment immediately without reloading',async()=>{
 const file={id:'file',contentId:'content',fileName:'shared.png',mimeType:'image/png',byteSize:4,uploaderId:'other',storagePath:'content/shared.png',createdAt:'now'};
 render(<Attachments contentId="content" attachments={[]} listMediaAction={async()=>[{id:'asset',fileName:'shared.png',mimeType:'image/png',byteSize:4,uploaderId:'other',storagePath:'library/shared.png',createdAt:'now',archivedAt:null}]} useMediaAction={async()=>({ok:true,data:file})}/>);
 await userEvent.click(screen.getByRole('button',{name:'从素材库选用'}));await userEvent.click(await screen.findByRole('button',{name:'选用 shared.png'}));await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());expect(screen.getByRole('button',{name:'预览 shared.png'})).toBeInTheDocument();
 });
});
