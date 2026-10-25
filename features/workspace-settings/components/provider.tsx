'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import {defaultWorkspacePreferences,type WorkspacePreferences} from '../types';
const Context=createContext({preferences:defaultWorkspacePreferences,error:'',loading:false,reload:async()=>{}});
export function WorkspacePreferencesProvider({children}:{children:React.ReactNode}){
 const [preferences,setPreferences]=useState(defaultWorkspacePreferences),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const reload=useCallback(async()=>{try{const response=await fetch('/api/workspace-preferences',{cache:'no-store'});if(!response.ok)throw Error('read failed');const data:WorkspacePreferences=await response.json();setPreferences(data);setError('');}catch{setError('工作区资料暂时无法读取，当前显示上一次资料。');}finally{setLoading(false);}},[]);
 useEffect(()=>{let active=true;fetch('/api/workspace-preferences',{cache:'no-store'}).then(async response=>{if(!response.ok)throw Error('read failed');return response.json();}).then(data=>{if(active){setPreferences(data);setError('');}}).catch(()=>{if(active)setError('工作区资料暂时无法读取，请重试。');}).finally(()=>{if(active)setLoading(false);});const update=(event:Event)=>setPreferences((event as CustomEvent<WorkspacePreferences>).detail);window.addEventListener('workspace-preferences-saved',update);return()=>{active=false;window.removeEventListener('workspace-preferences-saved',update);};},[]);
 return <Context.Provider value={{preferences,error,loading,reload}}>{error?<div role="alert" className="workspace-load-warning">{error}<button type="button" onClick={()=>void reload()}>重试读取工作区</button></div>:null}{children}</Context.Provider>;
}
export function useWorkspacePreferences(){return useContext(Context);}
export function WorkspaceBrandCopy(){const {preferences}=useWorkspacePreferences();return <span className="marketing-brand-copy"><strong className="workspace-brand-name">{preferences.name}</strong>{' '}<small>{preferences.description}</small></span>;}
