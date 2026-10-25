'use client';
import {useClerk} from '@clerk/nextjs';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
export function AccountManagement({security=false}:{security?:boolean}){const {openUserProfile}=useClerk();const [error,setError]=useState('');return <><Button type="button" onClick={()=>{try{openUserProfile();}catch{setError('账号管理暂时打不开，请稍后重试。');}}}>{security?'管理账号安全与登录设备':'管理姓名、头像和登录账号'}</Button>{error?<p role="alert">{error}</p>:null}<p className="marketing-caption">账号资料与安全由 Clerk 管理。是否显示双重验证等选项，取决于这套登录应用启用的功能；这里不会修改员工/管理员权限。</p></>;}
