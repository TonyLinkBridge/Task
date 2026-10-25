import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe,it,expect,vi} from 'vitest';
import {FileUpload} from '@/components/arc/file-upload/file-upload';
const input=()=>document.querySelector<HTMLInputElement>('input[type=file]')!;
describe('official Arc File Upload',()=>{
 it('opens the picker with Enter and Space and exposes its helper',async()=>{render(<FileUpload label="上传文件" description="最大100MB"/>);const target=screen.getByRole('button',{name:/上传文件/});const picker=vi.spyOn(input(),'click');target.focus();await userEvent.keyboard('{Enter} ');expect(picker).toHaveBeenCalledTimes(2);expect(target).toHaveAttribute('aria-describedby');expect(input()).toHaveAttribute('tabindex','-1');});
 it('does not select files when disabled',()=>{render(<FileUpload disabled label="上传文件"/>);expect(input()).toBeDisabled();expect(screen.getByRole('button',{name:/上传文件/})).toHaveAttribute('aria-disabled','true');});
 it('rejects invalid files and retries a failed actual upload',async()=>{const user=userEvent.setup({applyAccept:false});const upload=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce(undefined);render(<FileUpload accept="image/*" onUpload={upload}/>);await user.upload(input(),new File(['x'],'bad.exe',{type:'application/x-msdownload'}));expect(upload).not.toHaveBeenCalled();expect(screen.getByText('This file type is not accepted.')).toBeInTheDocument();await user.upload(input(),new File(['png'],'ok.png',{type:'image/png'}));await user.click(await screen.findByRole('button',{name:'Retry ok.png'}));expect(upload).toHaveBeenCalledTimes(2);});
 it('removal aborts the actual signal and returns focus to the dropzone',async()=>{let signal:AbortSignal|undefined;render(<FileUpload label="上传文件" onUpload={async(_file,options)=>{signal=options.signal;await new Promise(()=>{});}}/>);await userEvent.upload(input(),new File(['png'],'cancel.png',{type:'image/png'}));await userEvent.click(screen.getByRole('button',{name:'Remove cancel.png'}));expect(signal?.aborted).toBe(true);await waitFor(()=>expect(screen.getByRole('button',{name:/上传文件/})).toHaveFocus());});
});
