import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';
import 'leaflet-search';
import { ItineraryService } from 'src/app/features/itinerary/itinerary.service';
import { SERVER_ADDR } from 'src/environments/environment.prod';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
  iconUrl = 'assets/map-icons/marker-icon.png';
  shadowUrl = 'assets/map-icons/marker-shadow.png';
  image_server=SERVER_ADDR+'images/images';
  @Input('pois') pois;
  @Input('selectedPoi') selectedPoi;
  @Input('user') user;
  

  @Output() name = new EventEmitter<string>();
  @Output() lat = new EventEmitter<number>(null);
  @Output() long = new EventEmitter<number>(null);

  @Output() selectedChange = new EventEmitter<any>();
  @Output() selectedPOIChange = new EventEmitter<any>();

  private map: L.map;
  private perugiaLatLng = [43.110717, 12.390828];

  private poiLayer: L.Marker[] = [];
  private searchTouristControl: L.Control;
  private searchAdminControl: L.Control;
  private newPoi: L.marker = null;
  private layerGroup = new L.layerGroup();

  constructor(private translateService: TranslateService, private itinararyService:ItineraryService, private viewContainerRef: ViewContainerRef) { }

  @ViewChild('popupTemplate', {static: false, read: TemplateRef }) popupTemplate!: TemplateRef<any>;

  seticon() {
    const iconDefault = L.icon({
      iconUrl: this.iconUrl,
      shadowUrl: this.shadowUrl,
      iconAnchor: [12.5, 41],
      iconSize: [25, 41],
      shadowSize: [25, 41],
      shadowAnchor: [12.5, 41],
      popupAnchor: [0, -41],
      tooltipAnchor: [0, -25],
    });

    L.Marker.prototype.options.icon = iconDefault;
  }
  
  toggleState(poi:any, newState: number) {
    
    const previousState = poi.isSelected;
    poi.isSelected = newState;
    if (poi.isSelected==-1){
      this.itinararyService.listPoiToExclude.push(poi.id)
      if(this.itinararyService.listPoiToInclude.includes(poi.id))
        this.itinararyService.listPoiToInclude=this.itinararyService.listPoiToInclude.filter(id=>id!=poi.id)
    }
    else if (poi.isSelected==1){     
      this.itinararyService.listPoiToInclude.push(poi.id)
      if(this.itinararyService.listPoiToExclude.includes(poi.id))
        this.itinararyService.listPoiToExclude=this.itinararyService.listPoiToExclude.filter(id=>id!=poi.id)
    }
    else{
      if(this.itinararyService.listPoiToInclude.includes(poi.id))
        this.itinararyService.listPoiToInclude=this.itinararyService.listPoiToInclude.filter(id=>id!=poi.id)
      if(this.itinararyService.listPoiToExclude.includes(poi.id))
        this.itinararyService.listPoiToExclude=this.itinararyService.listPoiToExclude.filter(id=>id!=poi.id)
    }
    if (previousState !== poi.isSelected) {
      this.selectedChange.emit({ poiId: poi.id, isSelected: poi.isSelected });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map !== undefined) {
      this.seticon();
      if (changes.pois && changes.pois.previousValue) {
        const previousPois = changes.pois.previousValue || [];
        const currentPois = changes.pois.currentValue || [];

        currentPois.forEach((poi) => {
            const oldPoi = previousPois.find(p => p.id === poi.id);
            if (oldPoi && oldPoi.isSelected !== poi.isSelected) {
                this.updatePopup(poi); 
            }
        });
        const newPois = currentPois.filter(poi => !previousPois.some(p => p.id === poi.id));
        if (newPois.length > 0) {
            this.createMarkers(); 
        }
    } else if (changes.pois) {
      console.log("entrato")
        this.createMarkers();
    }
      if (changes.selectedPoi) {
        if (changes.selectedPoi.currentValue != null) {
          this.searchTouristControl._input.value = this.selectedPoi;
          this.searchTouristControl.searchText(this.selectedPoi);
          this.searchTouristControl._button.click();
          if (changes.selectedPoi.previousValue == null) {
            setTimeout(() => {
              if (this.searchTouristControl._button) {
                this.searchTouristControl._button.click();
              } if (this.searchTouristControl.collapse) {
                this.searchTouristControl.collapse(); 
              }
            }, 400);
          }else  if (this.searchTouristControl.collapse) {
            setTimeout(() => {
                this.searchTouristControl.collapse(); 
            },400);
           
          }
        }
      }
    }
  }
  createMarkers() {
    console.log("created")
    let self = this;
    this.poiLayer = [];
    this.layerGroup.clearLayers();

    this.pois.slice().reverse().forEach((poi) => {
        let marker = new L.marker([poi.latitude, poi.longitude], {
            name: poi.name,
            id: poi.id
        });

        marker.on('add', function() {
            if (window.innerWidth >= 768) {  
                this.bindTooltip('<b>' + poi.name + '</b>');
            }
           
        });
        const popupContainer = document.createElement('div');
        const view = self.viewContainerRef.createEmbeddedView(self.popupTemplate, { $implicit: poi });
        view.detectChanges();
        view.rootNodes.forEach(node => popupContainer.appendChild(node));

        marker.bindPopup(popupContainer); 

        marker.on('click', (event) => {
            const marker = event.target;
            this.selectedPOIChange.emit({ poiId: event.target.options.id });
            marker.openPopup();
            self.map.setView([poi.latitude + 0.1, poi.longitude], 10);
        });

        this.poiLayer.push(marker);
        marker.addTo(this.layerGroup);
    });

    this.layerGroup.addTo(this.map);
}
updatePopup(poi) {
  const marker = this.poiLayer.find(m => m.options.id === poi.id);
  if (marker) {
      const popup = marker.getPopup();
      if (popup && popup.isOpen()) {
          const popupContainer = document.createElement('div');
          const view = this.viewContainerRef.createEmbeddedView(this.popupTemplate, { $implicit: poi });
          view.detectChanges();
          view.rootNodes.forEach(node => popupContainer.appendChild(node));

          popup.setContent(popupContainer);
      }
  }
}

  private initTouristMap() {
    let searchText = '';
    this.translateService
      .get('map.search_input_placeholder')
      .subscribe((res: string) => {
        searchText = res;
      });
    var map = this.map;
    this.searchTouristControl = new L.Control.Search({
      layer: this.layerGroup,
      propertyName: 'name',
      marker: false,
      collapsed: true,
      tipAutoSubmit: true,
      firstTipSubmit: true,
      textPlaceholder: searchText,
      filterData: function (text, records) {
        var filteredData = {};
        for (var key in records) {
          if (key.toLowerCase().indexOf(text.toLowerCase()) !== -1) {
            filteredData[key] = records[key];
          }
        }
        return filteredData;
      }
    }).on('search:locationfound',  (e)=> {
      let lat=e.latlng.lat+0.1;
      let lng=e.latlng.lng;
      setTimeout(function () {
        map.setView({
           lat,
           lng
      },10 );
      },100)

      e.layer.openPopup();
    })
      .addTo(this.map);

  }


  private initAdminMap() {
    this.searchAdminControl = new L.Control.Search({
      url: 'https://nominatim.openstreetmap.org/search?format=json&q={s}',
      jsonpParam: 'json_callback',
      markerLocation: true,
      propertyName: 'display_name',
      propertyLoc: ['lat', 'lon'],
      autoCollapse: true,
      autoType: false,
      minLength: 2,
      marker: false,
      moveToLocation: (latlng, title, map) => {
        map.setView(latlng, 15);
        this.name.emit(title);
        this.lat.emit(latlng.lat);
        this.long.emit(latlng.lng);
        if (this.newPoi == null)
          this.newPoi = L.marker(latlng)
            .bindTooltip('<b>' + title + '</b>')
            .bindPopup(
              '<b>' +
              title +
              ':</b><br>[' +
              latlng.lat.toString() +
              ',' +
              latlng.lng.toString() +
              ']'
            )
            .addTo(map);
        else
          this.newPoi
            .setLatLng(latlng)
            .setTooltipContent('<b>' + title + '</b>')
            .setPopupContent(
              '<b>' +
              title +
              ':</b><br>[' +
              latlng.lat.lat.toString() +
              ',' +
              latlng.lng.toString() +
              ']'
            );
      },
      textPlaceholder: 'search POI',
    });

    this.map.addControl(this.searchAdminControl);

    this.map.on('click', (event) => {
      this.lat.emit(event.latlng.lat);
      this.long.emit(event.latlng.lng);
      this.name.emit(null);

      if (this.newPoi == null)
        this.newPoi = L.marker(event.latlng)
          .bindTooltip(
            '[' +
            event.latlng.lat.toString() +
            ',' +
            event.latlng.lng.toString() +
            ']'
          )
          .bindPopup(
            'New POI: <br>' +
            '[' +
            event.latlng.lat.toString() +
            ',' +
            event.latlng.lng.toString() +
            ']'
          )
          .addTo(this.map);
      else
        this.newPoi
          .setLatLng(event.latlng)
          .setTooltipContent(
            '[' +
            event.latlng.lat.toString() +
            ',' +
            event.latlng.lng.toString() +
            ']'
          )
          .setPopupContent(
            'New POI: <br>[' +
            event.latlng.lat.toString() +
            ',' +
            event.latlng.lng.toString() +
            ']'
          );
    });
  }

  private initMap(): void {
    let openstreetmap = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        minZoom: 2,
        attribution:
          'Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    let openstreetmapOsm = L.tileLayer(
      'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
      {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 19,
        minZoom: 2,
      }
    );

    let allOptions = {
      'Standard OSM': openstreetmap,
      'Openstreetmap: Osm': openstreetmapOsm,
    };
    this.map = L.map('map', {
      center: this.perugiaLatLng,
      zoom: 8,
    });

    openstreetmap.addTo(this.map);
    L.control.layers(allOptions).addTo(this.map);

    L.control.scale().addTo(this.map);
    this.map.addLayer(this.layerGroup);

    if (this.user == 'tourist') this.initTouristMap();
    else if (this.user == 'admin') this.initAdminMap();
  }

  ngOnInit(): void {
    this.seticon();
    this.initMap();
  }
}
