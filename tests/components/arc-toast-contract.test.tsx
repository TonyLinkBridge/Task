import {act,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {ToastStackProvider,ToastStack,useToastStack} from '@/components/arc/toast-stack/toast-stack';
import Toast from '@/components/arc/toast/toast';
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it('keeps loading until updated and pauses the success timer while keyboard focus is in the stack',async()=>{
 vi.useFakeTimers();vi.spyOn(HTMLElement.prototype,'offsetHeight','get').mockReturnValue(70);
 function Control(){const {toast,update,count}=useToastStack();return <><output aria-label="队列数量">{count}</output><button onClick={()=>toast({id:'upload',type:'loading',title:'正在上传'})}>开始</button><button onClick={()=>update('upload',{type:'success',title:'上传完成'})}>完成</button></>;}
 render(<ToastStackProvider duration={1000}><Control/><ToastStack label="结果"/></ToastStackProvider>);
 fireEvent.click(screen.getByRole('button',{name:'开始'}));await act(()=>vi.advanceTimersByTimeAsync(10000));expect(screen.getByLabelText('队列数量')).toHaveTextContent('1');
 fireEvent.click(screen.getByRole('button',{name:'完成'}));fireEvent.keyDown(document,{altKey:true,code:'KeyT'});await act(()=>vi.advanceTimersByTimeAsync(10000));expect(screen.getByLabelText('队列数量')).toHaveTextContent('1');
 act(()=>screen.getByRole('button',{name:'开始'}).focus());await act(()=>vi.advanceTimersByTimeAsync(1100));expect(screen.getByLabelText('队列数量')).toHaveTextContent('0');
});
it('retains the requested standalone Toast status semantics and controlled dismiss API',()=>{const close=vi.fn();render(<Toast title="保存完成" description="资料已更新" open onOpenChange={close} duration={0}/>);expect(screen.getByRole('status')).toHaveAttribute('aria-live','polite');expect(screen.getByRole('status')).toHaveAttribute('aria-atomic','true');fireEvent.click(screen.getByRole('button',{name:'Dismiss notification'}));expect(close).toHaveBeenCalledWith(false);});
