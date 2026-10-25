import{notFound}from'next/navigation';
export default async function TeamSectionPage({params}:{params:Promise<{section:string[]}>}){const{section}=await params;if(!(['members','roles','audit'].includes(section[0])&&section.length===1)&&!(section[0]==='member'&&section.length===2))notFound();return null;}
