import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ArchivedTaskNotice } from '@/features/tasks/components/archived-task-notice';

it('explains the archive without offering task editing or notification deletion', () => {
  render(<ArchivedTaskNotice />);
  expect(screen.getByRole('heading', { name: '这个任务已经归档' })).toBeInTheDocument();
  expect(screen.getByText(/原本的通知仍然保留/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '返回通知' })).toHaveAttribute('href', '/marketing/inbox');
  expect(screen.getByRole('link', { name: '查看任务看板' })).toHaveAttribute('href', '/marketing/tasks');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
