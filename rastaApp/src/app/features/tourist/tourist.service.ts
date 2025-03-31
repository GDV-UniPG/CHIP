import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Itinerary } from 'src/app/core/models/itinerary.model';
import { POI_TOI_MANAGER_ADDRESS, POI_TOI_MATCHER_ADDRESS } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class TouristService {
 
  constructor(private http:HttpClient) { }

  saveUserToiPreferences(preferences:any){
    return this.http.post(POI_TOI_MANAGER_ADDRESS+ 'user/auth-tourist/save-toi-preferences',preferences)
  }

  getFavoriteItineraries(){
    return this.http.get(POI_TOI_MANAGER_ADDRESS+ 'user/auth-tourist/get-favorite-itineraries')
  }
  getRatedItineraries(){
    return this.http.get(POI_TOI_MANAGER_ADDRESS+ 'user/auth-tourist/get-rated-itineraries')
  }
  saveItineraryAsFavorite(itinerary){
    return this.http.post(POI_TOI_MANAGER_ADDRESS+ 'user/auth-tourist/save-itinerary-as-favorite',itinerary)
  }
  removeItineraryAsFavorite(id){
    return this.http.delete(POI_TOI_MANAGER_ADDRESS+ 'user/auth-tourist/remove-itinerary-from-favorites/'+id)
  }
  removeRatingFromItinerary(id){
    return this.http.delete(POI_TOI_MANAGER_ADDRESS+ 'user/auth-tourist/remove-rating-from-itinerary/'+id)
  }
  saveItineraryScore(itinerary){
    return this.http.post(POI_TOI_MANAGER_ADDRESS+ 'user/auth-tourist/save-itinerary-score',itinerary)
  }
  updateItineraryScore(id, score){
    return this.http.put(POI_TOI_MANAGER_ADDRESS+ 'user/auth-tourist/update-itinerary-score',{id, score})
  }
  updateItineraryInfo(itineraryInfo){
    return this.http.put(POI_TOI_MANAGER_ADDRESS+ 'user/auth-tourist/update-itinerary-info',itineraryInfo)
  }
  getStarterPointInfo(id_start){
    return this.http.get(POI_TOI_MANAGER_ADDRESS+ 'user/auth-tourist/get-itinerary-starter-point-info/'+id_start)
  }
}
