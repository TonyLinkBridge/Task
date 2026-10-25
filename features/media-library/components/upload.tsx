'use client';
import {useAppToast} from '@/components/feedback/app-toast';
import { useRef,useState } from 'react';
import { FileUpload } from '@/components/arc/file-upload/file-upload';
import { fileSchema,type ContentFileMeta } from '@/features/content/files/service';
import { uploadSignedFile,type UploadProgress } from '@/features/content/files/upload-signed-file';
import { createUploadQueue } from '../upload-queue';
import './upload.css';
const accept='image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
export function MediaUpload({save,disabled=false}:{save:(file:File,meta:ContentFileMeta,options:UploadProgress)=>Promise<void>;disabled?:boolean}){
 const {toast,update,dismiss}=useAppToast();
 const queue=useRef(createUploadQueue(2));const [error,setError]=useState<string|null>(null);
 return <div className="arc-file-upload" role="region" aria-label="文件上传"><FileUpload label="上传文件" description="拖入文件或点击选择；每个最大 100MB，最多同时上传两个。" accept={accept} multiple maxSize={100*1024*1024} disabled={disabled}
 onUpload={(file,options)=>queue.current(async()=>{setError(null);const parsed=fileSchema.safeParse({name:file.name,type:file.type,size:file.size});if(!parsed.success)throw Error('这个文件不能上传。');
 const notice=toast({type:'loading',title:'正在上传 '+file.name});
 try{await save(file,parsed.data,options);if(options.signal.aborted)dismiss(notice);else update(notice,{type:'success',title:'文件已经上传。',description:file.name});}catch(e){if(options.signal.aborted)dismiss(notice);else{const message=e instanceof Error?e.message:'上传没有成功，请重试。';setError(message);update(notice,{type:'error',title:'上传没有成功',description:message});}throw e;}},options.signal)}/>
 {error?<p role="alert" className="mt-2 text-sm text-destructive">{error}</p>:null}<p className="mt-2 text-xs text-muted-foreground">× 只移除上传列表中的这一行；已经保存的文件仍保留。传输中点击会取消上传。</p></div>;
}
export {uploadSignedFile};
