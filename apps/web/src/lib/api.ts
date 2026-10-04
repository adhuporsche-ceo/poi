const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

// Vercel Services routes browser requests to the API on the same origin.
// Keep the separate API origin for local development, where the apps run on
// different ports.
export const API = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, '')
  : process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:4000/api';
export async function request(path:string,init?:RequestInit){const response=await fetch(`${API}${path}`,{...init,headers:{'Content-Type':'application/json',...init?.headers},cache:'no-store'});if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.error||`Request failed (${response.status})`)}return response.status===204?null:response.json()}
