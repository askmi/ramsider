export type AccessoryOption = {id:string;name:string;group:string;price:number|null|{pro:number;gold:number}};
export type Translate = (key:string,values?:Record<string,string|number>)=>string;
