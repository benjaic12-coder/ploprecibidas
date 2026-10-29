export function galleryGesture(start:{x:number;y:number},end:{x:number;y:number}){
 const dx=end.x-start.x,dy=end.y-start.y;
 return {moved:Math.max(Math.abs(dx),Math.abs(dy))>12,step:Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5?(dx<0?1:-1):0};
}
