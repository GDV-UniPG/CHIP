import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PoiForRanking } from 'src/app/core/models/poi.model';
import { HttpClient } from '@angular/common/http';
import { TRAVEL_PLANNER_ADDRESS, POI_TOI_MANAGER_ADDRESS, POI_TOI_MATCHER_ADDRESS } from 'src/environments/environment.prod';
import { Constraints } from 'src/app/core/models/constraints.model';

@Injectable({
  providedIn: 'root'
})
export class ItineraryService {
  private userPrefPois = new BehaviorSubject<PoiForRanking[]>(null);
  variable = this.userPrefPois.asObservable();

  private userResult = new BehaviorSubject(null);
  result=this.userResult.asObservable();
  municipalities=[];
  trasport_mean='driving-car'

  listPoiToExclude = [];
  listPoiToInclude = [];

  updateVariable(value: PoiForRanking[]) {
    this.userPrefPois.next(value);
    this.userResult.next(null)
  }

  
  setResult(value) {
    this.userResult.next(value);
  }

  sendToiPreferences(preferences:any){
    return this.http.post(POI_TOI_MATCHER_ADDRESS + 'send-preferences',preferences)
  }

  getPoisDetails(poi_ids){
    return this.http.post(POI_TOI_MANAGER_ADDRESS + 'send-ids-for-pois-details', poi_ids)
  }

  getMunicipalities(){
    return this.http.get(POI_TOI_MANAGER_ADDRESS+"get-municipality")
  }

  getTransportMeans(){
    return this.http.get(POI_TOI_MANAGER_ADDRESS+"get-transport-means")
  }

  getMinMaxDuration(){
    return this.http.get(POI_TOI_MANAGER_ADDRESS+"get-poi-min-max-durations")
  }

  sendConstraints(constraints: Constraints){
    return this.http.post(TRAVEL_PLANNER_ADDRESS, constraints )
  }

  constructor(private http: HttpClient) { }
}
