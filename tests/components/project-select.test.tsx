import { createRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProjectSelect } from '@/components/ui/project-select';
const options=[{value:'',label:'全部'},{value:'low',label:'普通'},{value:'urgent',label:'紧急'},{value:'blocked',label:'停用',disabled:true}];
describe('Arc Select Task form integration',()=>{
 it('keeps an empty all-filter value in FormData and can return to it',async()=>{
  const user=userEvent.setup();render(<form aria-label="filters"><ProjectSelect label="优先级" name="priority" defaultValue="" options={options}/></form>);
  const form=screen.getByRole('form',{name:'filters'}) as HTMLFormElement;
  expect(screen.getByRole('combobox',{name:/优先级/})).toHaveTextContent('全部');
  expect(new FormData(form).get('priority')).toBe('');
  await user.click(screen.getByRole('combobox',{name:/优先级/}));await user.click(screen.getByRole('option',{name:'紧急'}));
  expect(new FormData(form).get('priority')).toBe('urgent');
  await user.click(screen.getByRole('combobox',{name:/优先级/}));await user.click(screen.getByRole('option',{name:'全部'}));
  expect(new FormData(form).get('priority')).toBe('');
 });
 it('restores the shown uncontrolled value as well as form data on reset',async()=>{
  const user=userEvent.setup();render(<form aria-label="reset"><ProjectSelect label="负责人" name="owner" defaultValue="a" options={[{value:'a',label:'Alice'},{value:'b',label:'Bob'}]}/><button type="reset">重置</button></form>);
  await user.click(screen.getByRole('combobox',{name:/负责人/}));await user.click(screen.getByRole('option',{name:'Bob'}));await user.click(screen.getByRole('button',{name:'重置'}));
  await waitFor(()=>expect(screen.getByRole('combobox',{name:/负责人/})).toHaveTextContent('Alice'));
  expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('owner')).toBe('a');
 });
 it('preserves a controlled change, disabled options, keyboard selection and focus return',async()=>{
  const user=userEvent.setup();const changed=vi.fn();const ref=createRef<HTMLButtonElement>();
  render(<ProjectSelect ref={ref} label="区域" description="选择一个区域" value="a" onValueChange={changed} options={[{value:'a',label:'Asia'},{value:'x',label:'Disabled',disabled:true},{value:'e',label:'Europe'}]}/>);
  const trigger=screen.getByRole('combobox',{name:/区域/});expect(trigger).toHaveAccessibleDescription('选择一个区域');
  trigger.focus();await user.keyboard('{ArrowDown}');expect(screen.getByRole('option',{name:'Disabled'})).toHaveAttribute('aria-disabled','true');
  await user.keyboard('{End}{Enter}');expect(changed).toHaveBeenCalledWith('e');await waitFor(()=>expect(trigger).toHaveFocus());expect(trigger).toHaveTextContent('Asia');
  await user.keyboard('{Enter}{Escape}');expect(changed).toHaveBeenCalledTimes(1);expect(trigger).toHaveFocus();expect(ref.current).toBe(trigger);
 });
 it('does not open or submit a disabled field',()=>{
  render(<form aria-label="disabled"><ProjectSelect label="区域" name="region" disabled defaultValue="a" options={[{value:'a',label:'Asia'}]}/></form>);
  expect(screen.getByRole('combobox',{name:/区域/})).toBeDisabled();fireEvent.click(screen.getByRole('combobox'));expect(screen.queryByRole('listbox')).not.toBeInTheDocument();expect(new FormData(screen.getByRole('form') as HTMLFormElement).has('region')).toBe(false);
 });
});
