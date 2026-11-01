const singular:Record<string,string>={Combos:'combo',Marcos:'marco',Bandas:'banda',Carteles:'cartel',Lonas:'lona',Props:'prop'};
export function catalogLabel(category:string,count:number){return count===1?(singular[category]||category.toLowerCase()):category.toLowerCase();}
