export type UploadProgress = { signal:AbortSignal; onProgress(percent:number):void };
export function uploadSignedFile(url:string,file:File,{signal,onProgress}:UploadProgress):Promise<void>{
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(new DOMException('上传已取消','AbortError'));return;}
  const xhr=new XMLHttpRequest();
  const cleanup=()=>signal.removeEventListener('abort',abort);
  const abort=()=>xhr.abort();
  xhr.open('PUT',url);xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');xhr.setRequestHeader('Cache-Control','max-age=3600');
  xhr.upload.onprogress=e=>{if(e.lengthComputable&&!signal.aborted)onProgress(Math.min(99,e.loaded/e.total*100));};
  xhr.onload=()=>{cleanup();if(xhr.status>=200&&xhr.status<300)resolve();else reject(Error('上传失败，请重试。'));};
  xhr.onerror=()=>{cleanup();reject(Error('网络中断，上传失败，请重试。'));};
  xhr.onabort=()=>{cleanup();reject(new DOMException('上传已取消','AbortError'));};
  signal.addEventListener('abort',abort,{once:true});xhr.send(file);
 });
}
