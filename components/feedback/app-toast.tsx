'use client';

import {createContext,useContext,useMemo,type ReactNode} from 'react';
import {ToastStack,ToastStackProvider,useToastStack,type ToastStackApi} from '@/components/arc/toast-stack/toast-stack';
import './toast-theme.css';

const Context=createContext<ToastStackApi|null>(null);
const standalone:ToastStackApi={toast:()=>'',update:()=>{},dismiss:()=>{}};

function ApplicationQueue({children}:{children:ReactNode}){
 const {toast,update,dismiss}=useToastStack();
 const api=useMemo(()=>({toast,update,dismiss}),[toast,update,dismiss]);
 return <Context.Provider value={api}>{children}<ToastStack label="操作提示" position="bottom-right" className="app-toast"/></Context.Provider>;
}

export function AppToastProvider({children}:{children:ReactNode}){
 return <ToastStackProvider duration={5000} limit={12}><ApplicationQueue>{children}</ApplicationQueue></ToastStackProvider>;
}

export function useAppToast(){return useContext(Context)??standalone;}
export function useOptionalAppToast(){return useContext(Context);}
