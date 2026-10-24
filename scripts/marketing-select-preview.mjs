// Disposable component acceptance only. No app route or business-data write.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const source=resolve(import.meta.dirname,'..');
const {root}=JSON.parse(await readFile(resolve(source,'.isolated/marketing/current-real.json'),'utf8'));
if(!resolve(root).startsWith(resolve(source,'.isolated/marketing/web')+'/'))throw Error('ISOLATED_PREVIEW_REQUIRED');
const page=resolve(root,'app/marketing-test/select/page.tsx');await mkdir(resolve(page,'..'),{recursive:true});
await writeFile(page,`'use client';
import {useState} from 'react';
import {Select} from '@/components/ui/select';
import {ThemeToggle} from '@/components/theme-toggle';
export default function SelectAcceptance(){const[result,setResult]=useState('');return <main style={{maxWidth:380,margin:'24px auto',padding:20,display:'grid',gap:24}}><h1>本机 Arc Select 检查</h1><p>只测试组件，不会写入任务或发通知。</p><ThemeToggle/><form style={{display:'grid',gap:20}} onSubmit={e=>{e.preventDefault();setResult(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))));}}><Select label="测试区域" name="region" defaultValue="asia" description="选择一个区域" options={[{value:'asia',label:'Asia'},{value:'disabled',label:'Disabled',disabled:true},{value:'europe',label:'Europe'},{value:'us',label:'United States'}]}/><Select label="长文字" name="long" defaultValue="long" options={[{value:'long',label:'这是一个比较长的平台或成员名称，用来检查窄屏不会被撑开'},{value:'short',label:'短名称'}]}/><Select label="停用选择框" name="disabled" disabled defaultValue="a" options={[{value:'a',label:'不能更改'}]}/><Select label="必填选择框" name="required" required options={[{value:'yes',label:'已选择'}]}/><div style={{display:'flex',gap:20}}><button type="submit">读取表单</button><button type="reset">重置表单</button></div></form><output aria-label="表单结果">{result}</output></main>}
`);
console.log('Prepared isolated component acceptance route on 3219');
