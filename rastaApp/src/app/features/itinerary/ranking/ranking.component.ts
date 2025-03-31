import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { PoiForRanking } from 'src/app/core/models/poi.model';
import { ItineraryService } from '../itinerary.service';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss']
})
export class RankingComponent implements OnInit {
  selectedItem: string | null = null;
  isMobile: boolean;
  userPrefPois: PoiForRanking[];
  @ViewChild('tooltip', { static: false }) tooltip: MatTooltip;
  @ViewChildren('itemRef') itemRefs: QueryList<ElementRef>;

  constructor(private itinararyService: ItineraryService) {
    this.isMobile = window.innerWidth <= 768;
  }


  @Output() next = new EventEmitter<void>();

  onNext() {
    this.next.emit();
  }
  onItemHover(item: string): void {
    this.selectedItem = item;
  }
  goLink(url: string) {
    window.open(url, '_blank');
  }
  ngOnInit(): void {
    this.itinararyService.variable.subscribe((value: PoiForRanking[]) => {
      let v = null;
      if (value != null) {
        v = value.slice(0, 50)
      }
      this.userPrefPois = v;
      if (this.userPrefPois != null) {
        this.userPrefPois.map(el => el.isSelected = 0)
        this.userPrefPois.forEach(poi => {
          poi.showTooltip = false;
          if (this.getPoiEmoticonColor(poi.positive) == null) poi.emoticon = null
          else {
            poi.emoticon = this.getPoiEmoticonColor(poi.positive)[0]
            poi.color = this.getPoiEmoticonColor(poi.positive)[1]

          }

        })
      }

    })
  }

  toggleTooltip(poi) {
    poi.showTooltip = !poi.showTooltip;
  }
  getPoiEmoticonColor(sentiment_positive) {
    if (sentiment_positive < 0) return null
    else if (sentiment_positive < 0.2) return ['1_full', 'rgb(234 71 63)']
    else if (sentiment_positive < 0.4) return ['2_full', 'rgb(249 204 80)']
    else if (sentiment_positive < 0.6) return ['3_full', 'rgb(254 208 10)']
    else if (sentiment_positive < 0.8) return ['4_full', 'rgb(136 195 22)']
    else if (sentiment_positive < 1) return ['5_full', 'rgb(19 141 5)']
  }
  onSelectedChange(event: { poiId: number, isSelected: number }) {
    const poi = this.userPrefPois.find(p => p.id === event.poiId);
    if (poi) {
      poi.isSelected = event.isSelected;
    }
  }
  onSelectedPOIChange(event: { poiId: number }) {
    const targetItem = this.itemRefs.toArray().find((item, index) => {
      return this.userPrefPois[index].id === event.poiId;
    });
    const rankingContainer = document.querySelector('.ranking-list');
    if (targetItem && rankingContainer) {
      const targetRect = targetItem.nativeElement.getBoundingClientRect();
      const containerRect = rankingContainer.getBoundingClientRect();
      const offsetTop = targetRect.top - containerRect.top;
      let scrollPosition = offsetTop - (rankingContainer.clientHeight / 2) + (targetItem.nativeElement.clientHeight / 2);
      scrollPosition += rankingContainer.scrollTop;
      rankingContainer.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
      const originalColor = targetItem.nativeElement.style.backgroundColor || '';
      targetItem.nativeElement.style.backgroundColor = '#ffeb3b3d';
      setTimeout(() => {
        targetItem.nativeElement.style.backgroundColor = originalColor;
      }, 1500);
    } else {
      console.error('Elemento o contenitore non trovato!');

    }
  }

  toggleState(poi: any, newState: number) {
    poi.isSelected = newState;
    if (poi.isSelected == -1) {
      this.itinararyService.listPoiToExclude.push(poi.id)
      if (this.itinararyService.listPoiToInclude.includes(poi.id))
        this.itinararyService.listPoiToInclude = this.itinararyService.listPoiToInclude.filter(id => id != poi.id)
    }
    else if (poi.isSelected == 1) {
      this.itinararyService.listPoiToInclude.push(poi.id)
      if (this.itinararyService.listPoiToExclude.includes(poi.id))
        this.itinararyService.listPoiToExclude = this.itinararyService.listPoiToExclude.filter(id => id != poi.id)
    }
    else {
      if (this.itinararyService.listPoiToInclude.includes(poi.id))
        this.itinararyService.listPoiToInclude = this.itinararyService.listPoiToInclude.filter(id => id != poi.id)
      if (this.itinararyService.listPoiToExclude.includes(poi.id))
        this.itinararyService.listPoiToExclude = this.itinararyService.listPoiToExclude.filter(id => id != poi.id)
    }

    this.userPrefPois = this.userPrefPois.map(poi => poi);
  }

  onSelectionChange(poi: any): void {
    if (poi.isSelected == -1) {
      this.itinararyService.listPoiToExclude.push(poi.id)
    }
    else if (poi.isSelected == 1) {
      this.itinararyService.listPoiToInclude.push(poi.id)
    }
    else {
      if (this.itinararyService.listPoiToInclude.includes(poi.id))
        this.itinararyService.listPoiToInclude = this.itinararyService.listPoiToInclude.filter(id => id != poi.id)
      if (this.itinararyService.listPoiToExclude.includes(poi.id))
        this.itinararyService.listPoiToExclude = this.itinararyService.listPoiToExclude.filter(id => id != poi.id)
    }
  }
}
