export class TouristUser {
    name:string
    surname:string
    email:string
    date_of_birth:string
    gender:number
    country:string
    region:string
    toi_pref:{
        name:string, score_preference:number
    }
    saved_tour:{
        id:number,
        name:string,
        description:string, 
        total_duration:number,
        score:number, 
        steps:{}
    }
}
export class AdminUser {
    name:string
    surname:string
    email:string
}

export class LoginCredentials{
    username:string
    pwd:string
}