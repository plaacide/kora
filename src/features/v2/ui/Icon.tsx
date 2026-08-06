export type IconName="home"|"briefcase"|"grid"|"inbox"|"mail"|"search"|"users"|"shield"|"shield-check"|"help"|"folder"|"more"|"pulse"|"landmark"|"globe"|"file"|"lock"|"chevron"|"eye"|"plus"|"calendar"|"arrow"|"check"|"columns"|"list"|"clock"|"trend"|"key"|"pencil"|"download"|"upload"|"trash"|"move"|"history"|"star"|"eye-off"|"folder-plus"|"maximize"|"minimize"|"logout"|"wallet"|"layers"|"presentation"|"chart"|"bulb"|"grip"|"close"|"check-square";

const paths:Record<string,string[]>={
// Rail — tracés repris à l'identique des maquettes du handoff.
home:["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"],
inbox:["M22 12h-6l-2 3h-4l-2-3H2","M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"],
users:["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2","M22 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75"],
shield:["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"],
help:["M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3","M12 17h.01"],
logout:["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","m16 17 5-5-5-5","M21 12H9"],
search:["m21 21-4.3-4.3"],
briefcase:["M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2","M3 7h18v13H3z"],
mail:["M3 5h18v14H3z","m3 6 9 7 9-7"],
folder:["M3 6h7l2 2h9v11H3z"],more:["M5 12h.01","M12 12h.01","M19 12h.01"],
// Le contour du bouclier s'arrêtait sur « a1 1 0 0 1 1z » : un arc à qui il
// manque son second rayon. Le navigateur rejetait le tracé ENTIER — l'icône
// ne dessinait que sa coche, sur fond de rien. Invisible jusqu'ici : aucun
// écran ne s'en servait.
"shield-check":["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z","m9 12 2 2 4-4"],
pulse:["M22 12h-4l-3 9L9 3l-3 9H2"],landmark:["M2 20h20","M5 20V8l7-5 7 5v12","M9 20v-6h6v6"],
globe:["M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10","M2 12h20"],
file:["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z","M15 2v5h5"],
lock:["M7 11V7a5 5 0 0 1 10 0v4","M5 11h14v10H5z"],chevron:["m6 9 6 6 6-6"],
eye:["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"],
plus:["M12 5v14","M5 12h14"],calendar:["M3 5h18v16H3z","M7 3v4","M17 3v4","M3 10h18"],
arrow:["M5 12h14","m13 6 6 6-6 6"],check:["m5 12 4 4L19 6"],
columns:["M4 4h6v16H4z","M14 4h6v16h-6z"],list:["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"],
clock:["M12 6v6l4 2"],trend:["m3 17 6-6 4 4 8-9","M15 6h6v6"],
key:["m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"],
// Les gestes sur une pièce ou un dossier — menus « ⋯ ».
// Même jeu de tracés que le reste : trait de 1,75, cadre 24, bouts arrondis.
// Une icône par geste, et jamais deux gestes sous la même : dans une liste
// qu'on parcourt vite, la forme est lue avant le mot.
pencil:["M12 20h9","M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"],
download:["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","m7 10 5 5 5-5","M12 15V3"],
upload:["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","m17 8-5-5-5 5","M12 3v12"],
trash:["M3 6h18","M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6","M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
move:["m15 14 5-5-5-5","M4 20v-7a4 4 0 0 1 4-4h12"],
history:["M3 12a9 9 0 1 0 3-6.7L3 8","M3 3v5h5","M12 7v5l3.5 2"],
star:["m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"],
"eye-off":["M9.9 4.2A11 11 0 0 1 12 4c7 0 10 7 10 7a18 18 0 0 1-2.2 3.2M6.7 6.7A18 18 0 0 0 2 11s3 7 10 7a11 11 0 0 0 5.3-1.3","m2 2 20 20","M14.1 14.1a3 3 0 1 1-4.2-4.2"],
"folder-plus":["M3 6h7l2 2h9v11H3z","M12 12v5","M9.5 14.5h5"],
// Quatre coins qui s'écartent : le plein écran. J'avais pris « grid » et
// « columns » — des icônes de MISE EN PAGE, qui promettent de changer la
// disposition, pas d'agrandir. Une icône qui ment sur ce qu'elle fait est un
// bouton qu'on n'ose plus cliquer.
maximize:["M8 3H5a2 2 0 0 0-2 2v3","M21 8V5a2 2 0 0 0-2-2h-3","M3 16v3a2 2 0 0 0 2 2h3","M16 21h3a2 2 0 0 0 2-2v-3"],
minimize:["M8 3v3a2 2 0 0 1-2 2H3","M21 8h-3a2 2 0 0 1-2-2V3","M3 16h3a2 2 0 0 1 2 2v3","M16 21v-3a2 2 0 0 1 2-2h3"],
// Rail du parcours programme — tracés relevés un à un dans l'écran 01.
// « Portefeuille » n'est pas la mallette du rail fondateur : c'est la mallette
// à poignée haute, et elle porte un rectangle, d'où la généralisation de la
// table des rectangles juste en dessous.
wallet:["M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"],
layers:["M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z","m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65","m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"],
presentation:["M2 3h20","M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3","m7 21 5-5 5 5"],
chart:["M3 3v18h18","M18 17V9","M13 17V5","M8 17v-3"],
// L'ampoule du bloc « Conseil » — un conseil n'est ni une alerte ni une erreur.
bulb:["M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5","M9 18h6","M10 22h4"],
// La croix des lignes de critères. `trash` promettait une corbeille : ici on
// retire une ligne d'une liste qu'on est en train d'écrire, on ne supprime rien.
close:["M18 6 6 18","m6 6 12 12"],
// Une case cochée : structurer avec des Challenges, écran 00b.
"check-square":["M9 11l3 3L22 4","M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"],
grip:[]};

/** Cercles des maquettes : `<circle>`, pas un chemin approché. */
const circles:Record<string,Array<[number,number,number]>>={
search:[[11,11,8]],help:[[12,12,10]],users:[[9,7,4]],eye:[[12,12,3]],
clock:[[12,12,10]],globe:[[12,12,10]],
// La poignée de déplacement : six points, deux colonnes de trois.
grip:[[9,6,1.4],[15,6,1.4],[9,12,1.4],[15,12,1.4],[9,18,1.4],[15,18,1.4]]};

/**
 * Rectangles des maquettes : `x, y, largeur, hauteur, rayon`.
 *
 * La table ne portait que `x, y`, la taille étant écrite en dur à 7×7 — ce qui
 * allait tant que « Opérations » était seule à en avoir besoin. Le portefeuille
 * du rail programme porte un 20×14 : la taille remonte donc dans la donnée.
 */
const rects:Record<string,Array<[number,number,number,number,number]>>={
  grid:[[3,3,7,7,1],[14,3,7,7,1],[14,14,7,7,1],[3,14,7,7,1]],
  wallet:[[2,6,20,14,2]]};

export function Icon({name}:{name:IconName}){
  return (
    <svg aria-hidden="true" className="v2-icon" viewBox="0 0 24 24">
      {(rects[name]??[]).map(([x,y,w,h,rx])=><rect height={h} key={`${x}-${y}`} rx={rx} width={w} x={x} y={y}/>)}
      {(circles[name]??[]).map(([cx,cy,r])=><circle cx={cx} cy={cy} key={`${cx}-${cy}`} r={r}/>)}
      {(paths[name]??[]).map(d=><path d={d} key={d}/>)}
    </svg>
  );
}
