export class Constraints {
    pois:[{
        id_geo: number,
        score: number
    }]
    id_start: number
    lat_start: number
    long_start: number
    day_duration:number
    days:number
    poi_max_duration: number
    ids_to_exclude:any[]
    ids_to_include:any[]
    transport_mean:string
    n_alternatives: number
}

