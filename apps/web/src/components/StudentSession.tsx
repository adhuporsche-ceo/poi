'use client';
import {createContext,useContext,useEffect,useMemo,useState} from 'react';

type StudentSessionValue={studentId:string|null;student:Record<string,any>|null;profiles:Record<string,any>[];ready:boolean;activate:(student:Record<string,any>)=>void;select:(student:Record<string,any>)=>void;clear:()=>void};
const StudentSessionContext=createContext<StudentSessionValue|null>(null);
const STORAGE_KEY='careerflow.student.portal.v1';
const PORTALS_KEY='careerflow.student.portals.v1';

export function StudentSessionProvider({children}:{children:React.ReactNode}){
  const [student,setStudent]=useState<Record<string,any>|null>(null);
  const [profiles,setProfiles]=useState<Record<string,any>[]>([]);
  const [ready,setReady]=useState(false);
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(PORTALS_KEY)||'[]');if(Array.isArray(saved))setProfiles(saved.filter((x:any)=>typeof x?._id==='string'));const raw=localStorage.getItem(STORAGE_KEY);if(raw){const stored=JSON.parse(raw);if(typeof stored?._id==='string')setStudent(stored)}}catch{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(PORTALS_KEY)}finally{setReady(true)}},[]);
  const value=useMemo<StudentSessionValue>(()=>({studentId:student?._id||null,student,profiles,ready,activate:(profile)=>{const safe={_id:profile._id,fullName:profile.fullName,databaseName:profile.databaseName||''};const next=[safe,...profiles.filter(x=>x._id!==safe._id)];localStorage.setItem(STORAGE_KEY,JSON.stringify(safe));localStorage.setItem(PORTALS_KEY,JSON.stringify(next));setProfiles(next);setStudent(safe)},select:(profile)=>{const safe={_id:profile._id,fullName:profile.fullName,databaseName:profile.databaseName||''};localStorage.setItem(STORAGE_KEY,JSON.stringify(safe));setStudent(safe)},clear:()=>{localStorage.removeItem(STORAGE_KEY);setStudent(null)}}),[student,profiles,ready]);
  return <StudentSessionContext.Provider value={value}>{children}</StudentSessionContext.Provider>;
}
export function useStudentSession(){const value=useContext(StudentSessionContext);if(!value)throw new Error('useStudentSession must be used within StudentSessionProvider');return value;}
