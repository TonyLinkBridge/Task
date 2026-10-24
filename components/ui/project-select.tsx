"use client";
import { forwardRef } from 'react';
import { Select as ArcSelect, type SelectProps } from '@/components/arc/select/select';
/** Arc's real component. Empty filter options retain their label and native empty form value. */
export const ProjectSelect = forwardRef<HTMLButtonElement, SelectProps>(function ProjectSelect({ options, placeholder, ...props }, ref) {
  return <ArcSelect ref={ref} {...props} options={options} placeholder={placeholder ?? options.find(option=>option.value==='')?.label ?? '请选择'} />;
});
