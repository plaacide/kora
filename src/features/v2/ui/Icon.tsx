export type IconName="home"|"briefcase"|"mail"|"search"|"users"|"shield"|"shield-check"|"help"|"folder"|"more"|"pulse"|"landmark"|"globe"|"file"|"lock"|"chevron"|"eye"|"plus"|"calendar"|"arrow"|"check"|"columns"|"list"|"clock"|"trend";
const paths:Record<IconName,string[]>={
home:["M3 11.5 12 4l9 7.5","M5.5 10.5V20h13v-9.5"],briefcase:["M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2","M3 7h18v13H3z"],
mail:["M3 5h18v14H3z","m3 6 9 7 9-7"],search:["M21 21l-4.3-4.3","M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0"],
users:["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2","M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"],
shield:["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"],help:["M9 9a3 3 0 1 1 5.5 1.8c-.9.9-2.5 1.4-2.5 3.2","M12 18h.01"],
folder:["M3 6h7l2 2h9v11H3z"],more:["M5 12h.01","M12 12h.01","M19 12h.01"],
"shield-check":["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z","m9 12 2 2 4-4"],
pulse:["M22 12h-4l-3 9L9 3l-3 9H2"],landmark:["M2 20h20","M5 20V8l7-5 7 5v12","M9 20v-6h6v6"],
globe:["M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10","M2 12h20","M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20"],
file:["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z","M15 2v5h5"],
lock:["M7 11V7a5 5 0 0 1 10 0v4","M5 11h14v10H5z"],chevron:["m6 9 6 6 6-6"],
eye:["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7","M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6"],
plus:["M12 5v14","M5 12h14"],calendar:["M3 5h18v16H3z","M7 3v4","M17 3v4","M3 10h18"],
arrow:["M5 12h14","m13 6 6 6-6 6"],check:["m5 12 4 4L19 6"],
columns:["M4 4h6v16H4z","M14 4h6v16h-6z"],list:["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"],
clock:["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20","M12 6v6l4 2"],
trend:["m3 17 6-6 4 4 8-9","M15 6h6v6"]};
export function Icon({name}:{name:IconName}){return <svg aria-hidden="true" className="v2-icon" viewBox="0 0 24 24">{paths[name].map(d=><path d={d} key={d}/>)}</svg>}
