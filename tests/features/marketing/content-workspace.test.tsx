import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
const roomSequence=vi.hoisted(()=>({next:0}));
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn(),push:vi.fn()}),usePathname:()=>'/marketing/content/test'}));
vi.mock('@/features/approval/actions',()=>({approveContent:vi.fn(),archiveContent:vi.fn(),markPublished:vi.fn(),requestChanges:vi.fn(),submitForReview:vi.fn(),unlockApprovedContent:vi.fn()}));
vi.mock('@/features/content/actions/inline-threads',()=>({clearResolvedComments:vi.fn()}));
vi.mock('@/features/content/actions/content',()=>({deleteScheduledContent:vi.fn(),updateScheduledContent:vi.fn()}));
vi.mock('@/features/content/actions/comments',()=>({addContentComment:vi.fn(),refreshContentComments:vi.fn()}));
vi.mock('@/features/content/files/actions',()=>({requestUpload:vi.fn(),finishUpload:vi.fn()}));
vi.mock('@/features/content/components/content-room',async()=>{const{useState}=await import('react');return{ContentRoom:({children}:{children:React.ReactNode})=>{const[session]=useState(()=>++roomSequence.next);return <div data-testid="actual-room-slot" data-session={session}>{children}</div>;}};});
vi.mock('@/features/marketing/components/collaboration-guard',()=>({MarketingCollaborationGuard:({children}:{children:React.ReactNode})=><>{children}</>}));
vi.mock('@/features/marketing/components/room-permission-sync',()=>({MarketingRoomPermissionSync:({children}:{children:React.ReactNode})=><>{children}</>}));
vi.mock('@liveblocks/react',()=>({useBroadcastEvent:()=>vi.fn()}));
vi.mock('@/features/content/components/blocknote-editor',()=>({BlockNoteEditor:({editable}:{editable:boolean})=><div data-testid="inline-review" data-editable={String(editable)}/>}));
vi.mock('@/features/content/components/snapshot-viewer',()=>({SnapshotViewer:()=> <div>固定审核正文</div>}));
import { MarketingContentWorkspace } from '@/features/marketing/components/content-workspace';

const id='22222222-2222-4222-8222-222222222222';
const detail={
 content:{id,title:'Marketing 接入测试',status:'in_review',authorId:'employee',assigneeId:'employee',publishAt:'2026-10-25T04:00:00Z',liveblocksRoomId:`content:${id}`,currentVersion:2,requiredApprovals:2,requestedReviewerId:null,publishedBy:null,publishedAt:null,linkedTaskId:null,archivedAt:null,createdAt:'2026-10-24T00:00:00Z',updatedAt:'2026-10-24T00:00:00Z'},
 currentUser:{id:'admin-a',role:'admin',name:'上司A',imageUrl:null},
 approvals:[{id:'a',contentId:id,version:2,adminId:'admin-a',approvedAt:'2026-10-24T00:00:00Z',invalidatedAt:null,adminName:'上司A',adminImageUrl:null}],
 history:[],comments:[],attachments:[],platforms:[],platformIds:[],assignees:[],snapshotDocument:[],snapshotAttachments:[],editable:false,
 visibleAttachments:[{id:'33333333-3333-4333-8333-333333333333',contentId:id,storagePath:`${id}/snapshot.png`,fileName:'审核版本.png',mimeType:'image/png',byteSize:10,uploaderId:'employee',createdAt:'2026-10-24T00:00:00Z'}],
};
describe('connected marketing content workspace',()=>{
 it('starts a fresh collaboration session when a locked review returns to editing, and locks it again on resubmission',()=>{
  const{rerender}=render(<MarketingContentWorkspace detail={detail as never}/>);
  const lockedSession=screen.getByTestId('actual-room-slot').getAttribute('data-session');
  rerender(<MarketingContentWorkspace detail={{...detail,content:{...detail.content,status:'changes_requested'},editable:true} as never}/>);
  const editingSession=screen.getByTestId('actual-room-slot').getAttribute('data-session');
  expect(editingSession).not.toBe(lockedSession);
  rerender(<MarketingContentWorkspace detail={detail as never}/>);
  expect(screen.getByTestId('actual-room-slot').getAttribute('data-session')).not.toBe(editingSession);
 });
 it('retains fixed-version review, inline comments and one-of-two approval progress without allowing review uploads',()=>{
  render(<MarketingContentWorkspace detail={detail as never}/>);
  expect(screen.getByText('固定审核正文')).toBeInTheDocument();
  expect(screen.getByTestId('inline-review')).toHaveAttribute('data-editable','false');
  expect(screen.getByText('你已经批准，正在等待另一位管理员。')).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'批准内容'})).not.toBeInTheDocument();
  expect(screen.getByRole('link',{name:'下载 审核版本.png'})).toBeInTheDocument();
  expect(screen.queryByLabelText('上传文件')).not.toBeInTheDocument();
 });
 it('gives the other admin the actual review controls and restores draft uploads after return',()=>{
  const {rerender}=render(<MarketingContentWorkspace detail={{...detail,currentUser:{...detail.currentUser,id:'admin-b'}} as never}/>);
  expect(screen.getByRole('button',{name:'批准内容'})).toBeInTheDocument();
  rerender(<MarketingContentWorkspace detail={{...detail,content:{...detail.content,status:'changes_requested'},editable:true,visibleAttachments:[]} as never}/>);
  expect(screen.getByTestId('inline-review')).toHaveAttribute('data-editable','true');
  expect(screen.getByLabelText('上传文件')).toBeInTheDocument();
 });
});
