/** Bound file transfer concurrency; removal can cancel a queued item before it starts. */
export function createUploadQueue(limit=2){
 let active=0;const pending:(()=>void)[]=[];
 function drain(){while(active<limit&&pending.length)pending.shift()!();}
 return function run<T>(work:()=>Promise<T>,signal:AbortSignal):Promise<T>{return new Promise((resolve,reject)=>{
  const cancel=()=>{const at=pending.indexOf(start);if(at>=0)pending.splice(at,1);reject(new DOMException('上传已取消','AbortError'));};
  const start=()=>{signal.removeEventListener('abort',cancel);if(signal.aborted){cancel();return;}active++;Promise.resolve().then(work).then(resolve,reject).finally(()=>{active--;drain();});};
  if(signal.aborted){cancel();return;}signal.addEventListener('abort',cancel,{once:true});pending.push(start);drain();
 });};
}
