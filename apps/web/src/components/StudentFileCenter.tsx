'use client';

import {useEffect, useState} from 'react';
import {CheckCircle2,FileText,ImagePlus,LoaderCircle,Trash2,Upload} from 'lucide-react';
import {API,request} from '@/lib/api';

export type StudentFile = {
  _id:string;
  filename:string;
  contentType:string;
  kind:string;
  size:number;
  uploadDate:string;
  url:string;
};

export const requiredProofKinds=['proof_10th','proof_12th','proof_semester','proof_college_id','proof_resume'];

const proofTypes=[
  {kind:'proof_10th',label:'10th grade marksheet',description:'Upload your final 10th grade marksheet.',accept:'.pdf,.jpg,.jpeg,.png,.webp',multiple:false},
  {kind:'proof_12th',label:'12th grade or diploma marksheet',description:'Upload your 12th grade or diploma marksheet.',accept:'.pdf,.jpg,.jpeg,.png,.webp',multiple:false},
  {kind:'proof_semester',label:'Semester marksheets',description:'Upload your available semester marksheets. You can select more than one.',accept:'.pdf,.jpg,.jpeg,.png,.webp',multiple:true},
  {kind:'proof_college_id',label:'College identity card',description:'Upload a clear image or PDF of your current college identity card.',accept:'.pdf,.jpg,.jpeg,.png,.webp',multiple:false},
  {kind:'proof_resume',label:'Resume',description:'Upload your current resume as a PDF or image.',accept:'.pdf,.jpg,.jpeg,.png,.webp',multiple:false},
  {kind:'proof_additional',label:'Additional supporting proofs',description:'Optional: certificates, transfer certificate, scholarship proof, or other relevant documents.',accept:'.pdf,.jpg,.jpeg,.png,.webp',multiple:true},
];

const maxBytes=20*1024*1024;
const chunkBytes=512*1024;

function readableSize(bytes:number){
  if(bytes<1024*1024)return Math.max(1,Math.round(bytes/1024))+' KB';
  return (bytes/(1024*1024)).toFixed(1)+' MB';
}

function encodeBase64(buffer:ArrayBuffer){
  const bytes=new Uint8Array(buffer);
  let binary='';
  const block=0x8000;
  for(let i=0;i<bytes.length;i+=block)binary+=String.fromCharCode.apply(null,Array.from(bytes.subarray(i,i+block)));
  return btoa(binary);
}

function fileUrl(file:StudentFile){return API+file.url}

export function StudentFileCenter({studentId,section,onFilesChange}:{studentId:string;section:'photo'|'proofs';onFilesChange?:(files:StudentFile[])=>void}){
  const [files,setFiles]=useState<StudentFile[]>([]);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState('');
  const [progress,setProgress]=useState(0);
  const [error,setError]=useState('');

  const refresh=async()=>{
    const rows=await request('/students/'+studentId+'/files');
    setFiles(rows);
    if(onFilesChange)onFilesChange(rows);
    return rows as StudentFile[];
  };

  useEffect(()=>{
    let active=true;
    setLoading(true);
    request('/students/'+studentId+'/files').then((rows:StudentFile[])=>{
      if(!active)return;
      setFiles(rows);
      if(onFilesChange)onFilesChange(rows);
    }).catch((e:any)=>{if(active)setError(e.message||'Could not load saved uploads.')}).finally(()=>{if(active)setLoading(false)});
    return ()=>{active=false};
  },[studentId,onFilesChange]);

  const upload=async(file:File,kind:string)=>{
    setError('');
    if(file.size<1){setError('The selected file is empty.');return}
    const isPhoto=kind==='profile_photo';
    const allowedTypes=isPhoto?['image/jpeg','image/png','image/webp']:['application/pdf','image/jpeg','image/png','image/webp'];
    if(!allowedTypes.includes(file.type)){setError(isPhoto?'Choose a JPG, PNG, or WebP photo.':'Choose a PDF, JPG, PNG, or WebP document.');return}
    const limit=isPhoto?6*1024*1024:maxBytes;
    if(file.size>limit){setError('This file is too large. Maximum size: '+readableSize(limit)+'.');return}
    const key=kind+'-'+file.name;
    setWorking(key);setProgress(0);
    try{
      const session=await request('/students/'+studentId+'/files/init',{method:'POST',body:JSON.stringify({filename:file.name,mimeType:file.type,size:file.size,kind})});
      const count=Math.ceil(file.size/chunkBytes);
      for(let index=0;index<count;index++){
        const start=index*chunkBytes;
        const encoded=encodeBase64(await file.slice(start,Math.min(file.size,start+chunkBytes)).arrayBuffer());
        await request('/students/'+studentId+'/files/'+session.uploadId+'/chunks/'+index,{method:'PUT',body:JSON.stringify({chunk:encoded})});
        setProgress(Math.round(((index+1)/count)*100));
      }
      await request('/students/'+studentId+'/files/'+session.uploadId+'/complete',{method:'POST',body:'{}'});
      await refresh();
    }catch(e:any){setError(e.message||'Upload failed. Please try again.')}
    finally{setWorking('');setProgress(0)}
  };

  const remove=async(file:StudentFile)=>{
    if(!window.confirm('Remove '+file.filename+' from this student profile?'))return;
    setWorking('remove-'+file._id);setError('');
    try{await request('/students/'+studentId+'/files/'+file._id,{method:'DELETE'});await refresh()}
    catch(e:any){setError(e.message||'Could not remove this file.')}
    finally{setWorking('')}
  };

  const grouped=(kind:string)=>files.filter(file=>file.kind===kind).sort((a,b)=>new Date(a.uploadDate).getTime()-new Date(b.uploadDate).getTime());

  if(section==='photo'){
    const photos=grouped('profile_photo');
    const photo=photos[photos.length-1];
    return <section className="student-photo-upload" aria-labelledby="student-photo-heading">
      <div className="student-photo-copy"><h3 id="student-photo-heading">Student photo</h3><p>Add a recent, clear photo for the student profile. JPG, PNG, or WebP up to 6 MB.</p></div>
      <div className="student-photo-control">
        <div className="student-photo-preview">{photo?<img src={fileUrl(photo)} alt="Student profile" />:<ImagePlus size={24}/>}</div>
        <label className="app-btn outline upload-button"><Upload size={14}/>{working?progress+'%':'Upload photo'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!!working||loading} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file,'profile_photo');e.currentTarget.value=''}}/></label>
        {photo&&<a className="upload-open-link" href={fileUrl(photo)} target="_blank" rel="noreferrer">View saved photo</a>}
      </div>
      {loading&&<span className="upload-hint">Loading saved photo…</span>}
      {error&&<p className="upload-error">{error}</p>}
    </section>;
  }

  return <div className="proof-upload-center">
    <div className="proof-intro"><h3>hey_siri Upload your Proofs</h3><p>Add the documents needed for academic and placement review. Required items are marked; uploaded files are stored in this student’s MongoDB database.</p><p className="proof-file-note">Accepted formats: PDF, JPG, PNG, or WebP. Maximum 20 MB per document.</p></div>
    {error&&<div className="app-alert error">{error}</div>}
    <div className="proof-grid">{proofTypes.map(item=>{
      const records=grouped(item.kind);
      const complete=records.length>0;
      return <section className="proof-card" key={item.kind}>
        <div className="proof-card-heading"><div><h4>{item.label}{item.kind!=='proof_additional'&&<span className="required-mark"> *</span>}</h4><p>{item.description}</p></div><span className={'proof-state '+(complete?'complete':'')}>{complete?<><CheckCircle2 size={13}/> Added</>:item.kind==='proof_additional'?'Optional':'Required'}</span></div>
        <label className="app-btn outline small upload-button"><Upload size={14}/>{working.startsWith(item.kind)?progress+'%':'Choose file'}<input type="file" accept={item.accept} multiple={item.multiple} disabled={!!working||loading} onChange={e=>{const chosen=Array.from(e.target.files||[]);e.currentTarget.value='';void (async()=>{for(const file of chosen)await upload(file,item.kind)})()}}/></label>
        {records.length>0&&<ul className="proof-file-list">{records.map(file=><li key={file._id}><FileText size={15}/><a href={fileUrl(file)} target="_blank" rel="noreferrer" title={file.filename}>{file.filename}</a><small>{readableSize(file.size)}</small><button type="button" aria-label={'Remove '+file.filename} disabled={!!working} onClick={()=>void remove(file)}><Trash2 size={14}/></button></li>)}</ul>}
        {!records.length&&!loading&&item.kind!=='proof_additional'&&<p className="proof-missing">Please upload this document before Review.</p>}
      </section>;
    })}</div>
    {loading&&<p className="upload-hint"><LoaderCircle size={14} className="upload-spinner"/> Loading saved documents…</p>}
    <p className="proof-privacy"><CheckCircle2 size={14}/> Files stay linked to this individual student profile and are available again when the student returns.</p>
  </div>;
}
