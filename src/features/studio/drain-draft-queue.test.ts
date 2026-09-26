import {describe,it,expect,vi} from 'vitest';
import {drainDraftQueue} from './drain-draft-queue';
describe('confirmed draft save queue',()=>{
 it('uses database revisions even when local edit counters advance differently',async()=>{
  const latest={current:{revision:80,text:'first'}};const confirmed={current:{revision:1,text:'old'}};const revision={current:12};
  const persist=vi.fn(async(snapshot:{revision:number;text:string},expected:number)=>{
   if(snapshot.text==='first') latest.current={revision:85,text:'second'};
   return expected+1;
  });
  expect(await drainDraftQueue(latest,confirmed,revision,persist)).toBe(14);
  expect(persist.mock.calls.map(call=>call[1])).toEqual([12,13]);expect(confirmed.current.text).toBe('second');
 });
 it('keeps the last confirmed snapshot after failure and allows retry',async()=>{
  const latest={current:'new'};const confirmed={current:'old'};const revision={current:3};
  await expect(drainDraftQueue(latest,confirmed,revision,async()=>{throw Error('offline');})).rejects.toThrow('offline');
  expect(confirmed.current).toBe('old');expect(revision.current).toBe(3);
  expect(await drainDraftQueue(latest,confirmed,revision,async()=>4)).toBe(4);expect(confirmed.current).toBe('new');
 });
 it('does not re-save an equivalent externally hydrated document',async()=>{
  const persist=vi.fn();await drainDraftQueue({current:{text:'same'}},{current:{text:'same'}},{current:5},persist);expect(persist).not.toHaveBeenCalled();
 });
});
