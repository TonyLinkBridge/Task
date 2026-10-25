import {describe,it,expect,vi} from 'vitest';
import {createUploadQueue} from '@/features/media-library/upload-queue';
describe('upload queue',()=>{
 it('runs only two transfers and cancels queued work before it starts',async()=>{
  const run=createUploadQueue(2);const resolvers:(()=>void)[]=[];const work=vi.fn(()=>new Promise<void>(resolve=>resolvers.push(resolve)));
  const a=run(work,new AbortController().signal),b=run(work,new AbortController().signal);const cancel=new AbortController();const c=run(work,cancel.signal);const rejected=expect(c).rejects.toMatchObject({name:'AbortError'});
  await Promise.resolve();expect(work).toHaveBeenCalledTimes(2);cancel.abort();await rejected;resolvers.forEach(r=>r());await Promise.all([a,b]);expect(work).toHaveBeenCalledTimes(2);
 });
 it('releases its slot if work throws synchronously',async()=>{const run=createUploadQueue(1);await expect(run(()=>{throw Error('fail');},new AbortController().signal)).rejects.toThrow('fail');await expect(run(async()=>42,new AbortController().signal)).resolves.toBe(42);});
});
