import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';
import 'leaflet-search';
import 'leaflet-routing-machine';
import { openRouteservice } from './lrm-openrouteserviceV2'


@Component({
  selector: 'app-itinerary-map',
  templateUrl: './itinerary-map.component.html',
  styleUrls: ['./itinerary-map.component.scss']
})

export class ItineraryMapComponent implements AfterViewInit, OnInit {
  @Input('pois') pois;
  @Input('index') itineraryIndex;
  @Input('selectedPoi') selectedPoi;
  @Output() poiSelected = new EventEmitter<any>();

  @Input('transportMean') transportMean: string;

  private map: L.map;
  private poiLayer: L.Marker[] = [];
  private searchTouristControl: L.Control;
  private layerGroup = L.layerGroup();
  private latlngs;
  private poisGrouped: { [key: string]: any[] } = {};
  private poiMarkers: { [key: string]: L.Marker } = {};

  iconUrl1 = 'assets/map-icons/marker-number.png';
  iconUrlRed = 'assets/map-icons/marker-number-red.png';
  shadowUrl = 'assets/map-icons/marker-shadow.png';

  @ViewChild('contentContainer') container: ElementRef;

  constructor(private translateService: TranslateService, private renderer: Renderer2) {
  }



  ngOnInit(): void {
    const icon = L.icon({
      iconUrl: this.iconUrl1,
      shadowUrl: this.shadowUrl,
      iconAnchor: [15.5, 41],
      iconSize: [31, 41],
      shadowSize: [31, 41],
      shadowAnchor: [15.5, 41]
    });
    L.Marker.prototype.options.icon = icon;
    openRouteservice();
  }

  ngAfterViewInit(): void {
    if (document.getElementById('map' + this.itineraryIndex) == null)
      this.initMap()
  }
  private previousSelectedMarker: L.Marker | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (this.map !== undefined) {
      if (changes.pois) {
        this.poiLayer = [];
        this.layerGroup.clearLayers();
        if (changes.pois.currentValue !== null) {
          this.addPoisToMap(this.map.getZoom() > 15, false);
        }
      }
      if (changes.selectedPoi) {
        this.showSelectedPoi(changes.selectedPoi.previousValue, false)
      }
    }
  }

  private showSelectedPoi(previousPoi: any, hasZoomed: boolean) {
    const keyPoi = `${this.selectedPoi.latitude},${this.selectedPoi.longitude}`;
    const selectedMarker = this.poiMarkers[keyPoi];

    if (!hasZoomed) {
      if (previousPoi) {
        const previousKey = `${previousPoi.latitude},${previousPoi.longitude}`;
        const previousIndices = this.poisGrouped[previousKey].map(item => item.index).join(', ');

        this.previousSelectedMarker.setIcon(L.divIcon({ //set blue color to the previous red marker
          className: 'custom-div-icon',
          html: `<div class='marker-content'>${previousIndices}</div>`,
          iconAnchor: [15.5, 41],
          iconSize: [31, 41],
          popupAnchor: [0, -41],
          tooltipAnchor: [0, -20],
        }));
      }

    }

    if (selectedMarker) {
      const indices = this.poisGrouped[keyPoi].map(item => item.index).join(', ');

      const newIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class='selected-marker-content'>${indices}</div>`,
        iconAnchor: [15.5, 41],
        iconSize: [31, 41],
        popupAnchor: [0, -41],
        tooltipAnchor: [0, -20],
      });
      selectedMarker.setIcon(newIcon);


      selectedMarker.openPopup();
      setTimeout(() => {
        var popupElement = selectedMarker.getPopup().getElement();
        if (popupElement) {
          var popupHeight = popupElement.offsetHeight;
          var latlng = selectedMarker.getLatLng();
          var offset = Math.ceil(popupHeight / 2);
          selectedMarker._map.setView({ lat: latlng.lat, lng: latlng.lng })
          setTimeout(() => {
            selectedMarker._map.panBy([0, -offset]);
          }, 200)
        } else {
          console.log("L'elemento del popup non è disponibile.");
        }
      }, 0);

      if (!hasZoomed)
        if (previousPoi) {
          this.map.setView([this.selectedPoi.latitude, this.selectedPoi.longitude]);
        }

      this.previousSelectedMarker = selectedMarker;
    }
  }

  popupOptions = {
    minWidth: window.innerWidth < 768 ? 150 : 200 ,
    maxWidth: window.innerWidth < 768 ? 200 : 400 
  };
  private addPoisToMap(zoomHigh: boolean, hasZoomed: boolean): void {
    const markerOffset = 0.0001;
    const markerOffsetMap = new Map<string, number>();

    this.layerGroup.clearLayers();
    this.poiMarkers = {};
    this.poisGrouped = {}

    this.pois.forEach(async (poi, index) => {

      let key = `${poi.latitude},${poi.longitude}`;
      let offsetIndex = markerOffsetMap.get(key) || 0; //offset if POIs have the same coordintes 

      if (zoomHigh) {
        markerOffsetMap.set(key, offsetIndex + 1);
      } else {
        markerOffsetMap.set(key, 0); // if zoom is low -> no offset
      }
      //add offset to the coordinates
      const offsetLatitude = poi.latitude + (markerOffset * offsetIndex);
      const offsetLongitude = poi.longitude + (markerOffset * offsetIndex);

      key = `${offsetLatitude},${offsetLongitude}`;

      if (!this.poisGrouped[key]) {
        this.poisGrouped[key] = [];
      }
      this.poisGrouped[key].push({ poi, index });

      const indices = this.poisGrouped[key].map(item => item.index).join(', ');
      const names = this.poisGrouped[key].map(item => item.poi.name).join(', ');
      const icon = L.divIcon({ 
        className: 'custom-div-icon',
        html: `<div class='marker-content'>${indices}</div>`,
        iconAnchor: [15.5, 41],
        iconSize: [31, 41],
        popupAnchor: [0, -41],
        tooltipAnchor: [0, -20],
      });

      let popupContent = `
      <div style="text-align:center; min-width: 200px;">
          <h4 align=center><b>${poi.name}</b></h4>`;
      if(poi.image_url!=null){
        const imageUrl = `https://mozart.diei.unipg.it/rasta/images/images/${poi.id}.jpg`;
        popupContent += `<img src="${imageUrl}" alt="Image" style="max-height:150px;max-width:100%">`;
      }
      popupContent += `</div>`;


      const marker = L.marker([offsetLatitude, offsetLongitude], { icon: icon })
      .on('add', function() {
        if (window.innerWidth >= 768) {  
          this.bindTooltip('<b>' + names + '</b>');
        }
      })
        .bindPopup(popupContent, this.popupOptions)
        .on('click', () => this.onMarkerClick(poi, marker));
      this.layerGroup.addLayer(marker);
      this.poiMarkers[key] = marker;

      if (this.selectedPoi !== null) {
        this.showSelectedPoi(null, hasZoomed);
      }

    });
  }

  private onMarkerClick(poi: any, marker): void {
    this.poiSelected.emit(poi); 
    setTimeout(() => {
      var popupElement = marker.getPopup().getElement();
      if (popupElement) {
        var popupHeight = popupElement.offsetHeight;
        var latlng = marker.getLatLng();
        var offset = Math.ceil(popupHeight / 2);

        marker._map.setView({ lat: latlng.lat, lng: latlng.lng })
        setTimeout(() => {
          marker._map.panBy([0, -offset]);
        }, 200)
      } else {
        console.log("L'elemento del popup non è disponibile.");
      }
    }, 0);
  }

  private handleZoomChange() {
    const zoomLevel = this.map.getZoom();

    if (zoomLevel > 15) {
      this.addPoisToMap(true, true);
    } else {
      this.addPoisToMap(false, true);
    }
  }


  private initTouristMap() {
    let searchText = '';
    this.translateService
      .get('map.search_input_placeholder')
      .subscribe((res: string) => {
        searchText = res;
      });
    let url;

    if (this.transportMean == 'driving-car') {
      url = "https://mozart.diei.unipg.it/rasta/ors-app/ors/v2/directions"
    } else if (this.transportMean == 'cycling-regular') {
      url = "https://mozart.diei.unipg.it/rasta/ors-app-bike/ors/v2/directions"
    } else {
      url = "https://mozart.diei.unipg.it/rasta/ors-app-walking/ors/v2/directions"
    }

    const routingControl2 = L.Routing.control({
      waypoints: this.latlngs,
      lineOptions: { styles: [{ color: 'red', weight: 2 }] },
      fitSelectedRoutes: true,
      altLineOptions: { styles: [{ color: '#ed6852', weight: 2 }] },
      routeWhileDragging: false,
      addWaypoints: false,
      router: new L.Routing.openrouteserviceV2({
        serviceUrl: url,
        profile: this.transportMean,
        geometry_simplify: true
      })
    }).addTo(this.map);

    this.layerGroup.clearLayers();

    this.addPoisToMap(this.map.getZoom() > 15, false);

    this.searchTouristControl = new L.Control.Search({
      layer: this.layerGroup,
      propertyName: 'name',
      marker: false,
      collapsed: true,
      tipAutoSubmit: true,
      firstTipSubmit: true,
      textPlaceholder: searchText,
      zoom: 18,
    });
    this.map.addControl(this.searchTouristControl);
    this.map.on('zoomend', () => {
      this.handleZoomChange();
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

    let mapDiv = this.renderer.createElement('div');
    this.renderer.setAttribute(mapDiv, 'id', 'map' + this.itineraryIndex);
    this.renderer.setStyle(mapDiv, 'height', '100%');
    this.renderer.appendChild(this.container.nativeElement, mapDiv);

    this.latlngs = this.pois.map(poi => [poi.latitude, poi.longitude])

    this.map = L.map('map' + this.itineraryIndex).fitBounds(this.latlngs);

    openstreetmap.addTo(this.map);

    L.control.layers(allOptions).addTo(this.map);
    L.control.scale().addTo(this.map);

    this.map.addLayer(this.layerGroup);

    this.initTouristMap();
  }
}
