'use client';
import { Select } from "@/components/ui/select";
import Link from 'next/link';
import { useState } from 'react';
import { MarketingIcon } from './icon';
import { Attachments } from '@/features/content/components/attachments';
import type { MarketingLibraryGroup } from '../library-query-service';
export function MarketingLibrary({ groups }: { groups: MarketingLibraryGroup[] }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const filtered = groups.map(group => ({ ...group, attachments: group.attachments.filter(file => {
    const category = file.mimeType.startsWith('image/') ? 'image' : file.mimeType.startsWith('video/') ? 'video' : 'document';
    return (!type || category === type) && `${group.title} ${file.fileName}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  }) })).filter(group => group.attachments.length);
  return <>
    <div className="marketing-toolbar marketing-entry"><div className="marketing-filter-row"><label>搜索文件<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="文件名或内容标题" /></label><Select label="文件类型" value={type} onValueChange={setType} options={[{value:"",label:"全部文件"},{value:"image",label:"图片"},{value:"video",label:"影片"},{value:"document",label:"音频与文件"}]} /></div><Link className="marketing-primary" href="/marketing/content/new">建立内容并上传文件</Link></div>
    <p className="marketing-caption">这里汇总当前内容的文件。上传和移除仍在对应内容里处理，历史版本继续保留。</p>
    <div className="marketing-library-grid marketing-entry">{filtered.map(group => <article className="marketing-card marketing-library-group" key={group.id}><h2>{group.title}</h2><Link href={`/marketing/content/${encodeURIComponent(group.id)}`} aria-label={`打开内容：${group.title}`}>打开内容 →</Link><Attachments key={group.attachments.map(a => a.id).join('|')} contentId={group.id} attachments={group.attachments} editable={false} presentation="library" /></article>)}</div>
    {filtered.length === 0 ? <div className="marketing-card marketing-entry marketing-page-empty"><span className="marketing-empty-mark"><MarketingIcon name="library"/></span><h2>没有符合条件的文件。</h2><p>试试其他关键词，或在内容里上传图片和文件。</p></div> : null}
  </>;
}
