import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,it,vi} from 'vitest';
const setTheme=vi.hoisted(()=>vi.fn());
vi.mock('next-themes',()=>({useTheme:()=>({theme:'light',systemTheme:'dark',resolvedTheme:'light',setTheme})}));
vi.mock('@/components/feedback/app-toast',()=>({useAppToast:()=>({toast:vi.fn()})}));
import {ThemeOptions} from '@/features/workspace-settings/components/theme-options';
it('offers preview cards and supports keyboard radio selection with theme persistence',async()=>{
 const user=userEvent.setup();render(<ThemeOptions/>);
 const light=screen.getByRole('radio',{name:/^浅色/});const dark=screen.getByRole('radio',{name:/^深色/});
 expect(light).toHaveAttribute('aria-checked','true');await user.click(dark);expect(setTheme).toHaveBeenCalledWith('dark');
 light.focus();await user.keyboard('{End}');expect(setTheme).toHaveBeenCalledWith('system');expect(screen.getByRole('radio',{name:/跟随系统/})).toHaveFocus();
 expect(screen.getByText(/当前系统：深色/)).toBeInTheDocument();
});
