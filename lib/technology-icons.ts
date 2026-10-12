import mapping from './technology-icon-map.json';
import bounds from './technology-icon-patches.json';

export const technologyIconGroups=mapping.groups;
export function readingIconSource(photo:string,id:string){
 const group=technologyIconGroups.find(group=>group.photo===photo);
 if(!group?.icons.some(icon=>icon.id===id))throw new Error(`Unknown technology icon: ${photo}/${id}`);
 return `/art/technology/reading-icons/${photo}-${id}.png`;
}
export function readingIconAssets(source:string){
 const group=technologyIconGroups.find(group=>group.source===source);
 return group?[`/art/technology/reading-icons/${group.photo}-patch.png`,...group.icons.map(icon=>readingIconSource(group.photo,icon.id))]:[];
}
export function readingPhotoPatch(source:string){
 const group=technologyIconGroups.find(group=>group.source===source);
 return group?{src:`/art/technology/reading-icons/${group.photo}-patch.png`,box:bounds[group.photo as keyof typeof bounds],width:group.width,height:group.height}:null;
}
