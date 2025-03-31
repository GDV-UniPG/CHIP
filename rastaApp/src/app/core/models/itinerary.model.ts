export class Itinerary {
    id: number
    name: string
    description: string
    score: number
    transport_mean: string
    total_duration: number
    id_start:number
    total_duration_min:number
    steps: [{
        id_geo: number
        day: number
        step_number: number
        t_end: number
        t_visit_min: number
    }] | any
    open_details: boolean=false
    start_info:{
        name:string
        latitude: number
        longitude: number
    }
}
