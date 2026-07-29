export type IconName="home"|"briefcase"|"mail"|"search"|"users"|"shield"|"help"|"folder"|"more";
const paths:Record<IconName,string[]>={
home:["M3 11.5 12 4l9 7.5","M5.5 10.5V20h13v-9.5"],briefcase:["M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2","M3 7h18v13H3z"],
mail:["M3 5h18v14H3z","m3 6 9 7 9-7"],search:["M21 21l-4.3-4.3","M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0"],
users:["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2","M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"],
shield:["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"],help:["M9 9a3 3 0 1 1 5.5 1.8c-.9.9-2.5 1.4-2.5 3.2","M12 18h.01"],
folder:["M3 6h7l2 2h9v11H3z"],more:["M5 12h.01","M12 12h.01","M19 12h.01"]};
export function Icon({name}:{name:IconName}){return <svg aria-hidden="true" className="v2-icon" viewBox="0 0 24 24">{paths[name].map(d=><path d={d} key={d}/>)}</svg>}
