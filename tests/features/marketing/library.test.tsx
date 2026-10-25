import { chooseOption } from "@/tests/helpers/choose-option";
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MarketingLibrary } from '@/features/marketing/components/library';
import { makeMarketingLibraryQueries } from '@/features/marketing/library-query-service';
const attachment = { id: 'attachment-id', contentId: 'content-id', fileName: '图片.png', mimeType: 'image/png', storagePath: 'private/image.png', byteSize: 2048, uploaderId: 'author', createdAt: '2026-10-24T00:00:00Z' };
const group = { id: 'content-id', title: '原有内容', status: 'draft' as const, attachments: [attachment] };
describe('marketing library', () => {
  it('authenticates before loading records and propagates failures instead of showing an empty library', async () => {
    const list = vi.fn().mockResolvedValue([{ id: 'content-id', title: '原有内容', status: 'draft' }]);
    const queries = makeMarketingLibraryQueries({ getVerifiedUser: async () => { throw Error('UNAUTHENTICATED'); }, listContents: list, listAttachmentsForContents: async () => [] });
    await expect(queries.list()).rejects.toThrow('UNAUTHENTICATED'); expect(list).not.toHaveBeenCalled();
    const allowed = makeMarketingLibraryQueries({ getVerifiedUser: async () => {}, listContents: list, listAttachmentsForContents: async () => { throw Error('offline'); } });
    await expect(allowed.list()).rejects.toThrow('offline');
  });
  it('keeps canonical attachment IDs, preview/download and the owning content route', async () => {
    render(<MarketingLibrary groups={[group]} />);
    expect(screen.getByRole('link', { name: '打开内容：原有内容' })).toHaveAttribute('href', '/marketing/content/content-id');
    expect(screen.getByRole('link', { name: '下载 图片.png' })).toHaveAttribute('href', '/api/files/attachment-id?mode=download');
    await userEvent.click(screen.getByRole('button', { name: '预览 图片.png' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '图片.png 预览' })).toHaveAttribute('src', '/api/files/attachment-id?mode=preview');
  });
  it('filters files by query and type without exposing historical or fabricated records', async () => {
    render(<MarketingLibrary groups={[group]} />);
    await chooseOption(userEvent, "文件类型", "影片");
    expect(screen.getByText('没有符合条件的文件。')).toBeInTheDocument();
  });
});

it('loads attachments for 43 contents together and keeps each file in its owning group',async()=>{
 const contents=Array.from({length:43},(_,i)=>({id:`content-${i}`,title:`内容 ${i}`,status:'draft' as const}));
 const batch=vi.fn(async()=>[{...attachment,id:'first',contentId:'content-0'},{...attachment,id:'last',contentId:'content-42'},{...attachment,id:'unrelated',contentId:'private-other-content'}]);
 const queries=makeMarketingLibraryQueries({getVerifiedUser:async()=>{},listContents:async()=>contents,listAttachmentsForContents:batch});
 const groups=await queries.list();
 expect(groups).toHaveLength(43);
 expect(groups[0].attachments.map(a=>a.id)).toEqual(['first']);
 expect(groups[1].attachments).toEqual([]);
 expect(groups[42].attachments.map(a=>a.id)).toEqual(['last']);
 expect(batch).toHaveBeenCalledTimes(1);
 expect(batch).toHaveBeenCalledWith(contents.map(c=>c.id));
 expect(groups.flatMap(g=>g.attachments).some(a=>a.id==='unrelated')).toBe(false);
});
it('does not fetch attachments when there are no visible contents',async()=>{const batch=vi.fn();const q=makeMarketingLibraryQueries({getVerifiedUser:async()=>{},listContents:async()=>[],listAttachmentsForContents:batch});expect(await q.list()).toEqual([]);expect(batch).not.toHaveBeenCalled();});
