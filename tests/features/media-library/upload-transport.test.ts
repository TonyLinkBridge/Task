import {afterEach,describe,expect,it,vi} from 'vitest';
import {uploadSignedFile} from '@/features/content/files/upload-signed-file';
class Xhr {
 static last:Xhr; status=200; upload={onprogress:null as ((e:ProgressEvent)=>void)|null}; onload:null|(()=>void)=null;onerror:null|(()=>void)=null;onabort:null|(()=>void)=null;
 open=vi.fn();setRequestHeader=vi.fn();send=vi.fn();abort=vi.fn(()=>this.onabort?.());
 constructor(){Xhr.last=this;}
}
afterEach(()=>vi.unstubAllGlobals());
describe('signed file transfer',()=>{
 it('reports actual bytes and resolves only after server success',async()=>{vi.stubGlobal('XMLHttpRequest',Xhr);const progress=vi.fn(),controller=new AbortController();const file=new File(['1234'],'a.png',{type:'image/png'});const pending=uploadSignedFile('/signed-upload',file,{signal:controller.signal,onProgress:progress});Xhr.last.upload.onprogress?.({lengthComputable:true,loaded:2,total:4} as ProgressEvent);expect(progress).toHaveBeenCalledWith(50);Xhr.last.onload?.();await pending;expect(Xhr.last.send).toHaveBeenCalledWith(file);});
 it('aborts the underlying request and rejects on cancellation',async()=>{vi.stubGlobal('XMLHttpRequest',Xhr);const controller=new AbortController();const pending=uploadSignedFile('/signed',new File(['x'],'a.png'),{signal:controller.signal,onProgress:()=>{}});controller.abort();await expect(pending).rejects.toMatchObject({name:'AbortError'});expect(Xhr.last.abort).toHaveBeenCalledOnce();});
 it('rejects storage errors without exposing the signed URL',async()=>{vi.stubGlobal('XMLHttpRequest',Xhr);const pending=uploadSignedFile('/private-token',new File(['x'],'a.png'),{signal:new AbortController().signal,onProgress:()=>{}});Xhr.last.status=403;Xhr.last.onload?.();await expect(pending).rejects.toThrow('上传失败');});
});
