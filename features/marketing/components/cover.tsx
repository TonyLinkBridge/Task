'use client';
import Image from 'next/image';
import { useState } from 'react';
import { MarketingIcon } from './icon';
export function MarketingCover({attachmentId}:{attachmentId:string|null}) {
  const [failed,setFailed]=useState(false);
  if (!attachmentId || failed) return <span className="ov-hero__nomedia"><MarketingIcon name="library"/></span>;
  return <Image src={`/api/files/${encodeURIComponent(attachmentId)}?mode=preview`} alt="" fill sizes="(max-width: 600px) 90vw, 250px" unoptimized style={{objectFit:'cover'}} onError={()=>setFailed(true)}/>;
}
