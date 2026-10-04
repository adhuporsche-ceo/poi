import type {Metadata} from 'next';
import './globals.css';
import './application-form.css';
import {Shell} from '@/components/Shell';
import {StudentSessionProvider} from '@/components/StudentSession';
export const metadata:Metadata={title:'CareerFlow by Adhu Purze · Student Placement CRM',description:'Your career and placement command center'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><StudentSessionProvider><Shell>{children}</Shell></StudentSessionProvider></body></html>}
