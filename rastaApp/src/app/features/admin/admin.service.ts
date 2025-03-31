import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { POI_TOI_MANAGER_ADDRESS } from 'src/environments/environment.prod';
import { Observable } from 'rxjs';
import { Poi } from 'src/app/core/models/poi.model';
import { Toi } from 'src/app/core/models/toi.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient) { }

  getPois(): Observable<Poi[]> {
    return this.http.get<Poi[]>(POI_TOI_MANAGER_ADDRESS + "user/admin/get-pois");
  }
  addPOI(poi: Poi) {
    return this.http.post(POI_TOI_MANAGER_ADDRESS + 'user/admin/add-poi', poi);
  }
  deletePOI(id: number) {
    return this.http.delete(POI_TOI_MANAGER_ADDRESS + 'user/admin/delete-poi/' + id)
  }
  updatePOI(updatedPOI: Poi) {
    return this.http.put(POI_TOI_MANAGER_ADDRESS + 'user/admin/update-poi', updatedPOI)
  }

  getAllToi(): Observable<Toi[]> {
    return this.http.get<Toi[]>(POI_TOI_MANAGER_ADDRESS + "user/admin/get-all-tois");
  }
  getToi(): Observable<Toi[]> {
    return this.http.get<Toi[]>(POI_TOI_MANAGER_ADDRESS + "get-tois");
  }
  addToi(toi: Toi) {
    return this.http.post(POI_TOI_MANAGER_ADDRESS + 'user/admin/add-toi', toi);
  }
  updateToi(updatedToi: Toi) {
    return this.http.put(POI_TOI_MANAGER_ADDRESS + 'user/admin/update-toi', updatedToi)
  }

  deleteToi(id: number) {
    return this.http.delete(POI_TOI_MANAGER_ADDRESS + 'user/admin/delete-toi/' + id)
  }


  startPoiToiScoreComputation() {
    return this.http.get(POI_TOI_MANAGER_ADDRESS + 'user/admin/start-poi-toi-score-computation')
  }

  addAdmin(name: string, surname: string, email: string) {
    return this.http.post(POI_TOI_MANAGER_ADDRESS + 'user/admin/add-admin', { name, surname, email })
  }
  
  getSimilarityPoiGraphData(){
    return this.http.get(POI_TOI_MANAGER_ADDRESS + 'user/admin/get-similarity-poi-graph-data')
  }
  uploadImage(formData){
    return this.http.post(POI_TOI_MANAGER_ADDRESS + 'user/admin/images-upload', formData)
  }
}
