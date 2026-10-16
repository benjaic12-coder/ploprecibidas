import Campaign from './campaign';
export default async function Page({params}:{params:Promise<{slug:string}>}){return <Campaign slug={(await params).slug}/>}
