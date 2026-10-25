import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe,it,expect,vi} from 'vitest';
import {MediaPicker} from '@/features/media-library/components/picker';
const asset={id:'asset',fileName:'photo.png',mimeType:'image/png',byteSize:4,uploaderId:'me',storagePath:'library/me/photo.png',createdAt:'now',archivedAt:null};
describe('media picker',()=>{
 it('loads available assets, reports a locked-content failure and allows retry',async()=>{const action=vi.fn(async()=>({ok:false as const,message:'内容正在审核。'}));const attached=vi.fn();render(<MediaPicker contentId="content" listAction={async()=>[asset]} attachAction={action} onAttached={attached}/>);await userEvent.click(screen.getByRole('button',{name:'从素材库选用'}));await userEvent.click(await screen.findByRole('button',{name:'选用 photo.png'}));expect(await screen.findByRole('alert')).toHaveTextContent('内容正在审核。');expect(attached).not.toHaveBeenCalled();expect(screen.getByRole('dialog')).toBeInTheDocument();await userEvent.click(screen.getByRole('button',{name:'选用 photo.png'}));expect(action).toHaveBeenCalledTimes(2);});
 it('shows a retry button if available assets cannot be loaded',async()=>{const list=vi.fn().mockRejectedValueOnce(Error('network')).mockResolvedValueOnce([asset]);render(<MediaPicker contentId="content" listAction={list} attachAction={vi.fn()} onAttached={vi.fn()}/>);await userEvent.click(screen.getByRole('button',{name:'从素材库选用'}));await userEvent.click(await screen.findByRole('button',{name:'重新加载素材'}));expect(await screen.findByRole('button',{name:'选用 photo.png'})).toBeInTheDocument();});
});
