'use client';
import {useState} from 'react';
import {useErrorListener,useRoom,useStatus} from '@liveblocks/react';

/** A failed optimistic comment must not look like confirmed storage. Keep the draft visible to copy. */
export function MarketingCollaborationGuard({children}:{children:React.ReactNode}) {
 const room=useRoom();
 const status=useStatus();
 const [failed,setFailed]=useState(false);
 useErrorListener(()=>setFailed(true));
 const blocked=failed||status==='disconnected'||status==='reconnecting';
 return <>
  {blocked?<div role="alert" className="mb-4 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950">
   <p>协同连接或留言保存失败。这次修改尚未确认保存，请先复制未保存的文字，重新连接后检查并重试。</p>
   <button className="mt-3 rounded-lg border border-amber-500 px-3 py-2 font-medium" type="button" onClick={()=>{setFailed(false);room.reconnect();}}>重新连接</button>
  </div>:null}
  <div className="marketing-collaboration-body" inert={blocked||undefined}>{children}</div>
 </>;
}
