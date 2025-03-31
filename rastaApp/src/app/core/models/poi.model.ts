export class Poi {
    id:number
    name:string
    nome:string
    description:string
    descrizione:string
    url_primary:string
    wiki_url: string = null
    latitude:number;
    longitude:number;
    external_links:[{url: any}];
    visit_min_durations:[{duration_min:number}];
    scores:[{score:number, nome:string, name:string, id:number}];
    has_been_changed:boolean;
    has_score_changed:boolean;
    image_url:string
}

export class PoiForRanking {
    id:number
    name:string
    url_primary:string
    latitude:number;
    longitude:number;
    score:number;
    isSelected:number;
    positive:number;
    neutral:number;
    negative:number;
    emoticon:string;
    color:string
    showTooltip:boolean;
    image_url:string;
}

