import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
/** Interact with the real accessible menu, not Radix's hidden native select. */
export async function chooseOption(user: Pick<UserEvent, "click">, label: string, option: string) {
  await user.click(screen.getByRole('combobox',{name:new RegExp(label)}));
  await user.click(screen.getByRole('option',{name:option}));
}
