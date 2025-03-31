import { Component, ElementRef, OnInit } from '@angular/core';
import { AdminService } from '../../admin.service';
import * as d3 from 'd3';
import { Toi } from 'src/app/core/models/toi.model';
import { handleMouseLeaveNodes, handleMouseEnterNode, handleMouseClickNodes, handleMouseClickLegendToi } from './handleMouseListener'
import { latMin, latMax, lonMin, lonMax, width, height, defaultLinkColor, highlightlinkColor, adjacentColor, fontSize, defaultNodeOpacity, umbriaDistricts, umbriaDistrictsColors, purple, translateX, mapAspectRatio, svgAspectRatio, scaleX, scaleY, defaultNodeStroke, mapHeight, minRadiusNodes, maxRadiusNodes, paddingLegend, labelToShow, defaulfLinkOpacity, poisRectHeight, poisRectWidth, density, clickedNodeColor } from '../../../../core/constants/viz-constants';
import { FormControl } from '@angular/forms';
import { calculateEntropy, calculateMaxMinPerToi, computeLinks, coputePCACoordinates, createTooltip, dijkstraWithLinks, filterPois, resetLayout } from './util';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { AppUtilService } from 'src/app/core/services/app-util.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-visualization',
  templateUrl: './visualization.component.html',
  styleUrls: ['./visualization.component.scss']
})

export class VisualizationComponent implements OnInit {

  data: any; //data from server
  public saturatedToiColor=[];
  geoLayout = false;

  private svg: any;
  private legendToi: any;
  private legendDistrict: any;
  private simulation: any;

  private links;
  private groupedLinks;
  private nodeGroups;
  private groupedNodesbyToi;
  private groupedNodes;
  private nodes;
  private labels;
  private leaderLines //used for boundary labelling


  private currentTransform;
  private adjacentLinks = null;
  private showedLabels = [];
  areLabelHidden = false;
  areEdgesShowed = true

  tois: Toi[] = []
  poiToiMap = new Map();

  private mapUmbria;
  tresholdLinks = 80;
  tresholdLinksMin = 80;
  private nodesToHighlight = null;
  public clickedNodes = null;
  private nodeAdjLinkClicked = null;

  filteredPois: any[] = [];
  searchControl = new FormControl('');

  arePoisSelectedFromList = false;

  toiSelection: { [key: number]: number } = {};
  toiSelectionForSimilarity: { [key: number]: boolean } = {};
  labelSize = fontSize;
  private specificTois = [];

  visibleTOIs = [] 
  visibleColorTOIs = []
  instructionsTextWithLinks = ""
  instructionsTextNoLinks = ""

  toiMinMax = [];

  constructor(private adminService: AdminService,
    private el: ElementRef,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private translateService: TranslateService,
    private appUtilService: AppUtilService) {
    this.matIconRegistry.addSvgIcon(
      'custom_broom',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/broom.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'lazzo',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/lazzo.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'pca_icon',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/pca_icon.svg')
    );
  }

  ngOnInit(): void {

    this.translateService
      .get('admin.visualization.viz_label.instructionsTextWithLinks')
      .subscribe((res: string) => {
        this.instructionsTextWithLinks = res;
      });
    
    this.translateService
      .get('admin.visualization.viz_label.instructionsTextNoLinks')
      .subscribe((res: string) => {
        this.instructionsTextNoLinks = res;
      });

    this.adminService.getToi().subscribe(data => {
      this.tois = data
      this.visibleTOIs = this.tois.map(el => el.id);
      this.visibleColorTOIs = this.tois.map(el => el.id);
      this.adminService.getSimilarityPoiGraphData().subscribe(data => {
        this.data = data;
        this.searchControl.valueChanges.subscribe((query: string) => { 
          filterPois(query, this);
        });

        this.tois.forEach((toi) => {
          this.saturatedToiColor.push(toi.color);
          this.poiToiMap.set(toi.id, this.data.nodes.filter(poi => poi.toi === toi.id)); 
          this.toiSelectionForSimilarity[toi.id] = true;
          this.toiSelection[toi.id] = 0;
        })

        coputePCACoordinates(this.data.nodes, this.toiSelectionForSimilarity)
        calculateEntropy(this.data.nodes, true)
        this.data.nodes.forEach(node => {
          node.geoX = ((node.longitude - lonMin) / (lonMax - lonMin)) * width * scaleX + translateX;
          node.geoY = ((node.latitude - latMax) / (latMin - latMax)) * (mapHeight) * scaleY;
        });

        calculateMaxMinPerToi(this.data.nodes, this)

        let res = computeLinks(this.data.nodes, density, this.tresholdLinks / 100, this.toiSelectionForSimilarity)
        this.data.links = res.links;
        this.tresholdLinksMin = Math.round(res.minSimilarity * 100);
        this.tresholdLinks = Math.round(res.minSimilarity * 100);
        let densities = res.densities;
        this.renderBarChart(densities)
        this.createSVG();
        this.initializeSimulation();
      });
    });
  }

  renderBarChart(densities): void {
    const svg = d3.select(this.el.nativeElement).select('#barChartContainer');

    svg.selectAll("*").remove();
    const width = svg.node().clientWidth
    const height = svg.node().clientHeight

    const g = svg.append('g')

    const x = d3.scaleLinear()
      .domain([densities[0].similarity, 1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(densities, d => d.density)])
      .range([height, 15]);

    g.append('g')
      .selectAll('.tick')
      .data(x.ticks(10))
      .enter().append('line')
      .attr('x1', d => x(d))
      .attr('x2', d => x(d))
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', '#ddd');

    g.append('g')
      .selectAll('.tick')
      .data(y.ticks(5))
      .enter().append('line')
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('x1', 0)
      .attr('x2', width)
      .style('stroke', '#ddd');

    g.selectAll('.bar')
      .data(densities)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.similarity))
      .attr('width', width / densities.length - 2)
      .attr('y', d => y(d.density))
      .attr('height', d => height - y(d.density))
      .style('fill', 'steelblue');

    g.selectAll('.text')
      .data(densities)
      .enter().append('text')
      .attr('class', 'text')
      .attr('x', d => x(d.similarity) + (width / densities.length - 2) / 2)
      .attr('y', d => y(d.density) - 5)
      .attr('text-anchor', 'middle')
      .style("font-size", fontSize + 2)
      .text(d => Math.round(d.density));
  }

  isPCALayout = false;

  togglePCACoordinates() {
    if (!this.isPCALayout) {
      this.links.style('visibility', 'hidden');
      if (this.adjacentLinks != null) {
        this.adjacentLinks
          .style('visibility', 'visible')
          .attr("stroke", adjacentColor)
          .attr("stroke-opacity", "100%");
      }
      this.setPCAForce();
    } else {
      this.links.style("visibility", d => (d.weight * 100 < this.tresholdLinks) ? 'hidden' : 'visible')
      this.setForceDirectedSimulationForce()
      this.restartFromInitialPositions();
      this.simulation.alpha(1.9).alphaDecay(0.05).alphaMin(0.01).restart();
    }
    this.isPCALayout = !this.isPCALayout;
  }

  setPCAForce() {
    this.simulation
      .force("collide", d3.forceCollide().strength(0))
      .force("charge", d3.forceManyBody().strength(0))
      .force("link", null)
      .force('geo', null)
      .force("x", null)
      .force("y", null)
      .force("targetX", d3.forceX(d => d.targetX).strength(1))
      .force("targetY", d3.forceY(d => d.targetY).strength(1))
      .force("center", null)
      .on("tick", () => this.ticked())
      .on("end", () => {
        return null
      }
      )
    this.tois.forEach(toi => {
      if (!this.specificTois.includes(toi.id)) {
        this.simulation
          .force(`attractToCenter-${toi.id}`, null);
      }
    });

    this.simulation.alpha(1).restart();
  }

  computeLinksSimilarity() {
    this.simulation.stop();
    coputePCACoordinates(this.data.nodes, this.toiSelectionForSimilarity)
    this.data.links = (computeLinks(this.data.nodes, null, this.tresholdLinksMin / 100, this.toiSelectionForSimilarity)).links
    this.redraw();
    if(this.isPCALayout) this.setPCAForce()
    else this.updateFD();
  }

  redraw() {
    this.svg.selectAll(".links line").remove();
    this.renderLinks()
    this.svg.selectAll(".nodes").raise();
    this.svg.selectAll(".tooltip-source").raise();
    this.svg.selectAll(".tooltip-target").raise();
    this.svg.selectAll(".label").raise();
    this.resetZoom()
  }

  createSVG() {
    this.svg = d3.select(this.el.nativeElement).select('#graph')
      .append('svg')
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto;");

    this.mapUmbria = this.svg.append("svg:image").attr('xlink:href', './assets/umbria-map.png')
      .attr('width', '100%')
      .attr('height', mapHeight)
      .style("visibility", "hidden")
      .style("opacity", 0.5)

    this.currentTransform = d3.zoomIdentity;
    this.addSvgListener();
    this.renderLinks();
    this.renderNodes();
    this.renderLegends();
    this.renderPoisRect()
    createTooltip(this);
  }

  updateInstruction() {
    this.svg.select("#instructionText")
      .text(this.areEdgesShowed ? this.instructionsTextWithLinks : this.instructionsTextNoLinks);
    this.svg.select("#instructionRect").attr("width", this.svg.select("#instructionText").node().getComputedTextLength() + paddingLegend)
  }


  renderLegends() {
    this.legendToi = this.svg.append("g").attr("class", "legend");
    let self = this;
    this.legendToi.append("rect").attr("id", "legendToiRect")
      .attr("x", 8)
      .attr("y", 25 - (fontSize + 4))
      .attr("fill", "white")
      .style("opacity", 0.7);
    
    this.translateService
      .get('admin.visualization.viz_label.group_toi')
      .subscribe((res: string) => {
        this.legendToi.append("text")
      .text(res)
      .attr("x", 10)
      .attr("y", 28)
      .attr("font-size", fontSize + 4)
      .style("font-weight", 450)
      });

    

    let legendEdgeWidth = this.svg.append("g").attr("class", "legend").attr("id", "legendEdgeWidth");

    legendEdgeWidth.append("rect").attr("id", "legendEdgeWidth")
      .attr("id", "legendEdgeWidthRect")
      .attr("x", 8)
      .attr("y", height - 50 - (fontSize + 4))
      .attr("fill", "white")
      .style("opacity", 0.7);

      this.translateService
      .get('admin.visualization.viz_label.poi_sim')
      .subscribe((res: string) => {
        legendEdgeWidth.append("text")
        .text(res)
        .attr("x", 10)
        .attr("y", height - 50)
        .attr("font-size", fontSize + 4)
        .style("font-weight", 450);
      });
    

    legendEdgeWidth
      .append("line")
      .attr("x1", 10)
      .attr("x2", 55)
      .attr("y1", (d, i) => height - 40)
      .attr("y2", (d, i) => height - 40)
      .attr("stroke", defaultLinkColor)
      .attr('stroke-width', 0.5)

    legendEdgeWidth.append("text")
      .attr("id", "minTresholdLinksLegend")
      .text(this.tresholdLinks + "%")
      .attr("x", 65)
      .attr("y", height - 40 + (fontSize + 2) / 2)
      .attr("font-size", fontSize + 2)

    legendEdgeWidth.append("line")
      .attr("x1", 10)
      .attr("x2", 55)
      .attr("y1", (d, i) => height - 30)
      .attr("y2", (d, i) => height - 30)
      .attr("stroke", defaultLinkColor)
      .attr('stroke-width', 1.25);

    legendEdgeWidth.append("text")
      .attr("id", "middleTresholdLinksLegend")
      .text((100 + this.tresholdLinks) / 2 + "%")
      .attr("x", 65)
      .attr("y", height - 30 + (fontSize + 2) / 2)
      .attr("font-size", fontSize + 2)

    legendEdgeWidth.append("line")
      .attr("x1", 10)
      .attr("x2", 55)
      .attr("y1", (d, i) => height - 20)
      .attr("y2", (d, i) => height - 20)
      .attr("stroke", defaultLinkColor)
      .attr('stroke-width', 3);

    legendEdgeWidth.append("text")
      .text(100 + "%")
      .attr("x", 65)
      .attr("y", height - 20 + (fontSize + 2) / 2)
      .attr("font-size", fontSize + 2)

    d3.select("#legendEdgeWidthRect")
      .attr("width", legendEdgeWidth.node().getBBox().width + 6)
      .attr("height", legendEdgeWidth.node().getBBox().height + 8)

    const dynamicGroupTOI = this.legendToi.append("g")
      .attr("id", "dynamicText");


    dynamicGroupTOI.selectAll("circle")
      .data(this.tois)
      .join("circle")
      .attr("r", 3)
      .attr("fill", (d, i) => {
        return this.saturatedToiColor[i];
      })
      .attr("stroke", "black")
      .attr("stroke-width", "1px")
      .attr("cx", 15)
      .attr("cy", function (d, i) {
        return 10 * (i + 1) + 25;
      })
      .style("cursor", "pointer")
      .style("pointer-events", "click")
      .on("click", function (e, d) {
        handleMouseClickLegendToi.call(this, d, self, d3);
      });

    dynamicGroupTOI.selectAll("text")
      .data(this.tois)
      .join("text")
      .text((d) => d.name)
      .style("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-size", fontSize + 2)
      .attr("x", 30)
      .attr("y", function (d, i) {
        return 10 * (i + 1) + 28;
      })
      .style("cursor", "pointer")
      .style("pointer-events", "click")
      .on("click", function (e, d) {
        handleMouseClickLegendToi.call(this, d, self, d3);
      });

    this.legendToi.append("circle")
      .attr("r", 3)
      .attr("fill", "black")
      .attr("cx", 15)
      .attr("cy", 10 * (this.tois.length + 1) + 25)
      .style("cursor", "pointer")
      .style("pointer-events", "click")
      .on("click", function () {
        handleMouseClickLegendToi.call(this, null, self, d3);
      });

    this.legendToi.append("text")
      .text("All")
      .attr("x", 30)
      .attr("font-size", fontSize + 2)
      .attr("y", 10 * (this.tois.length + 1) + 28)
      .style("cursor", "pointer")
      .style("pointer-events", "click")
      .on("click", function () {
        handleMouseClickLegendToi.call(this, null, self, d3);
      });

    this.legendToi.select("#legendToiRect")
      .attr("width", this.legendToi.node().getBBox().width + 6).attr("height", this.legendToi.node().getBBox().height + 8)

    const legendToiGeo = this.svg.append("g").attr("id", "legendToiGeo").style("visibility", "hidden");

    const dynamicGroupToiGeo = legendToiGeo.append("g").attr("id", "dynamicTextGeoRect");

    legendToiGeo.append("rect").attr("id", "legendToiGeoRect")
      .attr("x", width / 2 + 50 - paddingLegend)
      .attr("y", 0)
      .attr("fill", "white")
      .style("opacity", 0.8);

    let circle = dynamicGroupToiGeo.selectAll("circle")
      .data(this.tois)
      .join("circle")
      .attr("id", (d, i) => `circleGeo-${i}`)
      .attr("r", 3)
      .attr("fill", (d, i) => {
       return this.saturatedToiColor[i];
      })
      .attr("stroke", "black")
      .attr("stroke-width", "1px")
      .attr("cy", fontSize + paddingLegend / 2);

    dynamicGroupToiGeo.selectAll("text")
      .data(this.tois)
      .join("text")
      .attr("id", (d, i) => `textGeo-${i}`)
      .text((d) => d.name)
      .style("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-size", fontSize + 2)
      .attr("y", fontSize + 2 + paddingLegend / 2)
      .attr("x", function (d, i) {
        if (i == 0) return width / 2 + 50 + paddingLegend / 2
        else {
          return dynamicGroupToiGeo.select("#textGeo-" + (i - 1)).node().getBBox().x + dynamicGroupToiGeo.select("#textGeo-" + (i - 1)).node().getBBox().width + 16
        }
      })
    circle.attr("cx", function (d, i) {
      if (i == 0) return width / 2 + 50
      else {
        return dynamicGroupToiGeo.select("#textGeo-" + (i)).node().getBBox().x - paddingLegend / 2
      }
    })
    legendToiGeo.select("#legendToiGeoRect")
      .attr("width", legendToiGeo.node().getBBox().width + paddingLegend).attr("height", legendToiGeo.node().getBBox().height + paddingLegend).lower()


    this.legendDistrict = this.svg.append("g").attr("class", "legend");

    this.legendDistrict.append("rect").attr("id", "legendDistrictRect")
      .attr("x", 8)
      .attr("y", height - 20)
      .attr("fill", "white")
      .style("opacity", 0.8);

      this.translateService
      .get('admin.visualization.viz_label.zoom_district')
      .subscribe((res: string) => {
        this.legendDistrict.append("text")
      .text(res)
      .attr("x", 10)
      .attr("y", height - 15 - paddingLegend / 2)
      .attr("font-size", fontSize + 4)
      .style("font-weight", 450)
      });
    

    const dynamicGroupDistrict = this.legendDistrict.append("g")
      .attr("class", "dynamic-text");

    dynamicGroupDistrict.selectAll("rect")
      .data(umbriaDistricts)
      .join("rect")
      .attr("id", (d, i) => `rect-${i}`)
      .attr("height", 10)
      .attr("fill", (d, i) => {
        return umbriaDistrictsColors[i];
      })
      .style("opacity", 0.7)
      .attr("y", height - 15)
      .style("cursor", "pointer")
      .style("pointer-events", "click")
      .on("click", (event, d) => {
        this.zoomTo(d.latitude, d.longitude, 2);
      })

    dynamicGroupDistrict.selectAll("text")
      .data(umbriaDistricts)
      .join("text")
      .attr("id", (d, i) => `text-${i}`)
      .text((d) => d.name)
      .style("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-size", fontSize + 2)
      .attr("y", height - 7)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        this.zoomTo(d.latitude, d.longitude, 2);
      })
      .attr("x", function (d, i) {
        if (i == 0) return 25
        else {
          return dynamicGroupDistrict.select("#text-" + (i - 1)).node().getBBox().x + dynamicGroupDistrict.select("#text-" + (i - 1)).node().getBBox().width + 31
        }
      })

    for (let i = 0; i < umbriaDistricts.length; i++) {
      const currentText = dynamicGroupDistrict.select(`#text-${i}`).node();
      const currentX = currentText.getBBox().x;
      const currentWidth = currentText.getBBox().width;

      if (i === 0) {
        const nextX = dynamicGroupDistrict.select(`#text-${i + 1}`).node().getBBox().x;
        const rectWidth = (nextX - currentX + currentWidth) / 2;

        dynamicGroupDistrict.select(`#rect-${i}`)
          .attr("x", currentX - 15)
          .attr("width", rectWidth + 13);
      }
      else if (i === umbriaDistricts.length - 1) {
        const prevText = dynamicGroupDistrict.select(`#text-${i - 1}`).node();
        const rectX = (prevText.getBBox().x + prevText.getBBox().width + currentX) / 2;
        const rectWidth = (width - rectX);

        dynamicGroupDistrict.select(`#rect-${i}`)
          .attr("x", rectX + 2)
          .attr("width", rectWidth - 4);

      } else {
        const prevText = dynamicGroupDistrict.select(`#text-${i - 1}`).node();
        const nextText = dynamicGroupDistrict.select(`#text-${i + 1}`).node();
        const rectX = (prevText.getBBox().x + prevText.getBBox().width + currentX) / 2;
        const rectWidth = (currentX + currentWidth + nextText.getBBox().x) / 2 - rectX;

        dynamicGroupDistrict.select(`#rect-${i}`)
          .attr("x", rectX + 2)
          .attr("width", rectWidth - 4);
      }
    }

    this.legendDistrict.select("#legendDistrictRect")
      .attr("width", this.legendDistrict.node().getBBox().width + paddingLegend).attr("height", this.legendDistrict.node().getBBox().height + paddingLegend)

    this.legendDistrict.attr("visibility", "hidden")
  }
  poisRectGroup = null;

  renderPoisRect() {
    this.poisRectGroup = this.svg.append("g")
      .attr("class", "barchart-container")
      .attr("transform", `translate(${width - poisRectWidth}, ${height - poisRectHeight})`)
      .style("display", "none");
    this.poisRectGroup.append("rect").attr("id", "poisRect")
      .attr("width", poisRectWidth)
      .attr("height", poisRectHeight)
      .attr("fill", "white")
      .attr("opacity", 0.8)

    this.poisRectGroup.append("g")
      .attr("id", "hideButton")
      .attr("transform", `translate(${poisRectWidth - 10}, 0)`)
      .style("cursor", "pointer")
      .on("click", () => {
        this.hideBarChart();
      })
      .html(`
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
          width="10px" height="10px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve">
          <path fill="none" stroke="#000000" stroke-width="4" stroke-miterlimit="10" d="M1,32c0,0,11,15,31,15s31-15,31-15S52,17,32,17 S1,32,1,32z"/>
          <circle fill="none" stroke="#000000" stroke-width="4" stroke-miterlimit="10" cx="32" cy="32" r="7"/>
          <line fill="none" stroke="#000000" stroke-width="4" stroke-miterlimit="10" x1="9" y1="55" x2="55" y2="9"/>
        </svg>
      `);
  }

  isPoisInfoRectVisible = true;

  splitName = (name) => {
    const maxLineLength = 40; 
    const words = name.split(' '); 
    let line1 = '';
    let line2 = '';

    for (const word of words) {
      if ((line1 + ' ' + word).trim().length <= maxLineLength) {
        line1 += word + ' ';
      } else {
        line2 += word + ' ';
      }
    }

    return [line1.trim(), line2.trim()];
  };

  showBarChart(poiData) {
    let name = poiData.name
    poiData = poiData.scores

    const data = this.tois.map((toi, index) => ({
      name: toi.name,
      value: poiData[index]
    }));

    this.showPoisInfo();

    this.poisRectGroup.selectAll(".bar").remove();
    this.poisRectGroup.selectAll(".bar-label").remove();
    this.poisRectGroup.selectAll(".poi-name").remove();

    const [line1, line2] = this.splitName(name);
    this.poisRectGroup.append("text")
      .attr("class", "poi-name")
      .attr("x", poisRectWidth / 2)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .attr("font-size", fontSize + 2)
      .attr("font-weight", "bold")
      .selectAll("tspan")
      .data([line1, line2])
      .enter()
      .append("tspan")
      .attr("x", poisRectWidth / 2)
      .attr("dy", (d, i) => i * fontSize * 1.2) 
      .text(d => d);

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([20, poisRectWidth - 5]) 
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([poisRectHeight - 20, 15]);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d3.format(".1f"));

    this.poisRectGroup.selectAll(".y-axis").remove();

    this.poisRectGroup.append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(20, 0)`)
      .call(yAxis).style("font-size", 7)
      .selectAll(".domain").attr("stroke", "#777");

    this.poisRectGroup.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.name))
      .attr("y", d => yScale(Math.max(0, d.value))) 
      .attr("width", xScale.bandwidth())
      .attr("height", d => Math.abs(yScale(d.value) - yScale(0)))
      .attr("fill", (d, i) =>  this.saturatedToiColor[i]);

    this.poisRectGroup.selectAll(".bar-label")
      .data(data)
      .enter().append("text")
      .attr("class", "bar-label")
      .attr("x", d => xScale(d.name) + xScale.bandwidth() / 2)
      .attr("y", poisRectHeight - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", fontSize)
      .attr("transform", d => {
        const x = xScale(d.name) + xScale.bandwidth() / 2;
        const y = poisRectHeight - 10;
        return `rotate(-20, ${x}, ${y})`;
      })
      .text(d => d.name);
  }

  showParallelCoordinatesChart(poisData) {
    this.showPoisInfo();

    this.poisRectGroup.selectAll(".bar").remove();
    this.poisRectGroup.selectAll(".poi-name").remove();
    this.poisRectGroup.selectAll(".parallel-path").remove();
    this.poisRectGroup.selectAll(".axis-label").remove();
    this.poisRectGroup.selectAll(".y-axis").remove();
    this.poisRectGroup.selectAll(".bar-label").remove();

    const tois = this.tois.map(toi => toi.name);
    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([poisRectHeight - 25, 10]);

  
    const xScale = d3.scalePoint()
      .domain(tois)
      .range([20, poisRectWidth - 20]);

    this.poisRectGroup.selectAll(".bar-label")
      .data(tois)
      .enter().append("text")
      .attr("class", "bar-label")
      .attr("x", d => xScale(d) + xScale.bandwidth() / 2)
      .attr("y", poisRectHeight - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", fontSize)
      .attr("transform", d => {
        const x = xScale(d) + xScale.bandwidth() / 2;
        const y = poisRectHeight - 10;
        return `rotate(-20, ${x}, ${y})`;
      })
      .text(d => d);

    tois.forEach((topic, i) => {
      const axisGroup = this.poisRectGroup.append("g")
        .attr("class", "axis-label")
        .attr("transform", `translate(${xScale(topic)}, 0)`);

      const yAxis = d3.axisLeft(yScale).ticks(5);

      axisGroup.call(yAxis);

      if (i !== 0) {
        axisGroup.selectAll(".tick text").remove();

      }
      axisGroup.selectAll(".tick text").style("font-size", 7)
      axisGroup.selectAll(".domain").attr("stroke", "#777")
    });

    const lineGenerator = d3.line()
      .x((d, i) => xScale(tois[i]))
      .y(d => yScale(d));

    let self = this;
    this.poisRectGroup.selectAll(".parallel-path")
      .data(poisData)
      .enter().append("path")
      .attr("class", "parallel-path")
      .attr("d", d => lineGenerator(d.scores))
      .attr("fill", "none")
      .attr("stroke", "url(#gradient)")
      .attr("stroke-width", 2)
      .on("mouseenter", function (event, poi) {
        d3.select('body').selectAll(".parallel-path").style("opacity", 0.1)
        d3.select(this).style("opacity", 1)

        const tooltipDiv = d3.select("body").append("div")
          .attr("class", "tooltip-coordinates")
          .style("position", "absolute")
          .style("background-color", "rgba(0, 0, 0, 0.7)")
          .style("color", "white")
          .style("padding", "5px")
          .style("border-radius", "5px")
          .style("font-size", `${fontSize + 6}px`)
          .style("pointer-events", "none")
          .style("display", "none");

        const poisRectNode = document.getElementById("poisRect");
        const poisRectBBox = poisRectNode?.getBoundingClientRect();

        if (poisRectBBox) {
          const tooltipY = poisRectBBox.y + window.scrollY - 40;

          tooltipDiv
            .html(poi.name)
            .style("z-index", 1)
            .style("display", "block");
          const tooltipWidth = tooltipDiv.node()?.getBoundingClientRect().width || 0;

          const tooltipX = poisRectBBox.x + window.scrollX + poisRectBBox.width / 2 - tooltipWidth / 2;

          tooltipDiv
            .style("left", `${tooltipX}px`)
            .style("top", `${tooltipY}px`);
        }
      })
      .on("mouseleave", function () {
        self.poisRectGroup.selectAll(".parallel-path").style("opacity", 1)
        d3.selectAll(".tooltip-coordinates").remove();
      });

    this.poisRectGroup.selectAll(".axis-label")
      .data(tois)
      .enter().append("text")
      .attr("class", "axis-label")
      .attr("x", d => xScale(d) + xScale.bandwidth() / 2)
      .attr("y", poisRectHeight - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", fontSize)
      .attr("transform", d => {
        const x = xScale(d) + xScale.bandwidth() / 2;
        const y = poisRectHeight - 10;
        return `rotate(-20, ${x}, ${y})`;
      })
      .text(d => d);
  }

  closeParallelCoordinates() {
    d3.selectAll(".parallel-path").remove();
    d3.selectAll(".axis-label").remove();
  }

  hideBarChart() {
    this.poisRectGroup.style("display", "none");
    this.isPoisInfoRectVisible = false;
  }
  showPoisInfo() {
    this.poisRectGroup.style("display", null);
    this.isPoisInfoRectVisible = true;
  }


  zoomTo(lat, long, scale) {
    long = ((long - lonMin) / (lonMax - lonMin)) * width * scaleX + translateX;
    lat = ((lat - latMax) / (latMin - latMax)) * height * scaleY;

    const xTransformed = d3.zoomIdentity.applyX(long);
    const yTransformed = d3.zoomIdentity.applyY(lat);

    const targetTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(scale)
      .translate(-xTransformed, -yTransformed);

    const currentScale = this.currentTransform.k;
    const currentX = this.currentTransform.x;
    const currentY = this.currentTransform.y;

    if (currentScale === targetTransform.k && currentX === targetTransform.x && currentY === targetTransform.y) {
      this.resetZoom();
    } else {
      let zoom = d3.zoom().scaleExtent([0.5, 5]).on("zoom", this.zoomed);
      this.svg.transition().duration(750).call(zoom.transform, targetTransform);
      this.currentTransform = targetTransform;
    }
  }

  renderLinks() {
    this.links = this.svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(this.data.links)
      .join("line")
      .attr("stroke", defaultLinkColor)
      .attr('stroke-width', (d: any) => {
        return (d.weight * 100 - this.tresholdLinks) / (100 - this.tresholdLinks) * 3
      })
      .attr("stroke-opacity", defaulfLinkOpacity);
    this.links
      .attr("id", (d) => {
        return `link-${d.source}-${d.target}`;
      })
    this.addLinkListener();
  }

  generateSegments(nodes, links) {
    var distance = function (source, target) {
      var dx2 = Math.pow(target.x - source.x, 2);
      var dy2 = Math.pow(target.y - source.y, 2);

      return Math.sqrt(dx2 + dy2);
    };
    var hypotenuse = Math.sqrt(width * width + height * height);

    var inner = d3.scaleLinear() 
      .domain([0, hypotenuse])
      .range([1, 20]);

    var bundle = { nodes: [], links: [], paths: [] };

    
    bundle.nodes = nodes.map(function (d, i) {
      d.fx = d.x;
      d.fy = d.y;
      return d;
    });

    links.forEach(function (d, i) {
      var length = distance(d.source, d.target);
      var total = Math.round(inner(length));

      var xscale = d3.scaleLinear()
        .domain([0, total + 1])
        .range([d.source.x, d.target.x]);

      var yscale = d3.scaleLinear()
        .domain([0, total + 1])
        .range([d.source.y, d.target.y]);

      var source = d.source;
      var target = null;

      var local = [source];

      for (var j = 1; j <= total; j++) {

        target = {
          x: xscale(j),
          y: yscale(j)
        };

        local.push(target);
        bundle.nodes.push(target);

        bundle.links.push({
          source: source,
          target: target
        });

        source = target;
      }

      local.push(d.target);
      bundle.links.push({
        source: target,
        target: d.target
      });

      bundle.paths.push(local);
    });

    return bundle;
  }


  distance(pointA, pointB) {
    const dx = pointB.x - pointA.x;
    const dy = pointB.y - pointA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }


  bundleMidpoints(links) {
    const tolerance = 12; 
    const adjustmentStrength = 1; 

    for (let k = 0; k < 3; k++) {
      links.forEach((link, i) => {
        const midPoint = { x: link.mid.x, y: link.mid.y }; 
        for (let j = 0; j < links.length; j++) {
          if (i !== j) {
            const otherMidPoint = { x: links[j].mid.x, y: links[j].mid.y };
            const dist = this.distance(midPoint, otherMidPoint);
            const distY = Math.abs(midPoint.y - otherMidPoint.y);

            if (dist < tolerance) {
              midPoint.y += (otherMidPoint.y - midPoint.y) / 2 * adjustmentStrength;
              midPoint.x += (otherMidPoint.x - midPoint.x) / 2 * adjustmentStrength;
              otherMidPoint.y += (midPoint.y - otherMidPoint.y) / 2 * adjustmentStrength;
              otherMidPoint.x += (midPoint.x - otherMidPoint.x) / 2 * adjustmentStrength;
            }
          }
        }

        
        link.mid.x = midPoint.x;
        link.mid.y = midPoint.y;
      });
    }

  }

  pathGroup = null;
  isBoundledEdge = false
  toggleBundling() {
    if (this.isBoundledEdge) {
      this.svg.selectAll(".links").style("visibility", "visible")
      this.svg.selectAll(".boundledLinks").style("visibility", "hidden")//.remove()
      this.isBoundledEdge = false;
    } else {
      this.renderBundledLink()
      this.isBoundledEdge = true;
    }
  }
  renderBundledLink() {
    if (this.pathGroup) {
      this.svg.selectAll(".boundledLinks").style("visibility", "visible")
      this.svg.selectAll(".links").style("visibility", "hidden")
    } else {
      this.links.data().forEach(link => {
        link.mid = {
          x: (link.source.x + link.target.x) / 2,
          y: (link.source.y + link.target.y) / 2,
        };
      });
      this.bundleMidpoints(this.links.data());
      var line = d3.line()
        .curve(d3.curveBundle.beta(1))
        .x((d) => d.x)
        .y((d) => d.y);
      this.svg.selectAll(".links").style("visibility", "hidden")
      this.pathGroup =
        this.svg.append("g")
          .attr("class", "boundledLinks")
          .selectAll('path')
          .data(this.links.data())
          .enter()
          .append('path')
          .attr('d', d => line([d.source, d.mid, d.target]))
          .style("fill", "none")
          .style("stroke", "#555")
          .style("stroke-width", 1)
          .style("stroke-opacity", 0.2)
          .style('display', d => (d.weight * 100 < this.tresholdLinks) ? 'none' : 'block');

      this.svg.selectAll(".nodes").raise();
      this.svg.selectAll(".tooltip-source").raise();
      this.svg.selectAll(".tooltip-target").raise();
      this.isBoundledEdge = true;
      this.addPathListener()
      this.resetZoom()
    }
  }

  renderNodes() {
    this.nodeGroups = this.svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(this.data.nodes)
      .join("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")

    this.nodes = this.nodeGroups.append("circle")
      .attr('r', (d) => {  
        const score = d.scores[this.tois.map(el => el.id).findIndex((e) => e === d.toi)];
        const toiMM = this.toiMinMax.filter((el) => el.toi == d.toi)[0]
       
        const normalizedScore = (score - toiMM.min) / (toiMM.max - toiMM.min);            
        const adjustedRadius = minRadiusNodes + Math.sqrt(normalizedScore) * (maxRadiusNodes - minRadiusNodes); 
        return Math.min(Math.max(adjustedRadius, minRadiusNodes), maxRadiusNodes); 
        const normalizedRadius = minRadiusNodes + (score - toiMM.min) / (toiMM.max - toiMM.min) * (maxRadiusNodes - minRadiusNodes);
        return Math.min(Math.max(normalizedRadius, minRadiusNodes), maxRadiusNodes);
      })
      .style("opacity", defaultNodeOpacity)
      .style("fill", (d) => {
        return this.saturatedToiColor[this.tois.map(el => el.id).findIndex((e) => e === d.toi)];
      })
      .attr("id", d => `node-${d.id}`)
      .attr("stroke", defaultNodeStroke);

    this.nodeGroups.append("line")
      .attr("class", "leaderLine")
      .attr("stroke", "gray")
      .attr("stroke-width", 1)
      .attr('stroke-dasharray', '2,2')
      .style("visibility", "hidden")
      .style("cursor", "none")

    this.labels = this.svg
      .append("g")
      .attr("class", "label")
      .selectAll("g")
      .data(this.data.nodes)
      .join("g")
      .attr("class", "label")
      .style("visibility", "hidden");

    this.labels.append("rect")
      .attr("height", this.labelSize + 4)
      .attr("fill", purple)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("fill-opacity", 0.80);

    this.labels.append("text")
      .text((d) => d.name)
      .attr("y", (this.labelSize + 4) / 2 +1)
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .style("font-size", this.labelSize)
      .style("font-weight", 200);

    this.addNodeListener();
    //INSTRUCTION
    this.svg.append("rect").attr("id", "instructionRect")
      .attr("x", 10 - paddingLegend / 2)
      .attr("y", 0)
      .attr("height", fontSize + 4 + paddingLegend / 2)
      .attr("fill", "white").style("opacity", 0.7);

    this.svg.append("text")
      .attr("id", "instructionText")
      .text(this.instructionsTextWithLinks)
      .attr("x", 10)
      .attr("y", paddingLegend)
      .style("font-size", fontSize + 4)
      .style("font-weight", 450)

    this.svg.select("#instructionRect").attr("width", this.svg.select("#instructionText").node().getComputedTextLength() + paddingLegend)
  }

  addLinkListener = () => {
    const self = this;
    this.links
      .on("mouseenter", function (e, d) {
        handleMouseEnterNode(d3.select(`#node-${d.source.id}`).node(), d.source, self, d3, "tooltip-source", true);
        handleMouseEnterNode(d3.select(`#node-${d.target.id}`).node(), d.target, self, d3, "tooltip-target", true);
        d3.select(this).attr("stroke", highlightlinkColor).attr("stroke-opacity", "90%")
      })
      .on("mouseleave", function (e, d) {
        handleMouseLeaveNodes(d3.select(`#node-${d.source.id}`).node(), d.source, self, d3, true);
        handleMouseLeaveNodes(d3.select(`#node-${d.target.id}`).node(), d.target, self, d3, true);

        if (self.adjacentLinks == null) {
          d3.select(this).attr("stroke", defaultLinkColor).attr("stroke-opacity", defaulfLinkOpacity)
        } else {
                   self.adjacentLinks.data().includes(d) ? d3.select(this).attr("stroke", adjacentColor).attr("stroke-opacity", "100%") : d3.select(this).attr("stroke", defaultLinkColor).attr("stroke-opacity", defaulfLinkOpacity);
        }
      })
  }
  addPathListener = () => {
    const self = this;
    this.pathGroup
      .on("mouseenter", function (e, d) {
        handleMouseEnterNode(d3.select(`#node-${d.source.id}`).node(), d.source, self, d3, "tooltip-source", true);
        handleMouseEnterNode(d3.select(`#node-${d.target.id}`).node(), d.target, self, d3, "tooltip-target", true);
        d3.select(this).attr("stroke", highlightlinkColor).attr("stroke-opacity", "90%")
      })
      .on("mouseleave", function (e, d) {
        handleMouseLeaveNodes(d3.select(`#node-${d.source.id}`).node(), d.source, self, d3, true);
        handleMouseLeaveNodes(d3.select(`#node-${d.target.id}`).node(), d.target, self, d3, true);

        if (self.adjacentLinks == null) {
          d3.select(this).attr("stroke", defaultLinkColor).attr("stroke-opacity", defaulfLinkOpacity)
        } else {
          self.adjacentLinks.data().includes(d) ? d3.select(this).attr("stroke", adjacentColor).attr("stroke-opacity", "100%") : d3.select(this).attr("stroke", defaultLinkColor).attr("stroke-opacity", defaulfLinkOpacity);
        }
      })
  }

  addNodeListener = () => {
    const self = this;
    this.nodes
      .on("mouseenter", function (e, d) {
        handleMouseEnterNode(this, d, self, d3, "tooltip-source", false);
      })
      .on("mouseleave", function (e, d) {
        handleMouseLeaveNodes(this, d, self, d3, false);
      })
      .on("contextmenu", (e, d) => {
        e.preventDefault()

        this.appUtilService.openDialog(d.name, "Go to the POI management page", null, null, () => {
          this.appUtilService.goLink(`admin/handle-poi?poiName=${encodeURIComponent(d.name)}`);
        })
      })
      .call(
        d3
          .drag()
          .on("start", this.dragstarted)
          .on("drag", this.dragged)
          .on("end", this.dragended)
      )
      .on("click", function (e, d) {
        handleMouseClickNodes.call(this, d, self, d3, true);
      });
  };


  addSvgListener = () => {
    let zoom = d3.zoom().scaleExtent([0.5, 5]).on("zoom", this.zoomed);
    this.svg.call(zoom)
    this.addSvgClickListener()
  };

  resetZoom() {
    let zoom = d3.zoom().scaleExtent([0.5, 5]).on("zoom", this.zoomed);
    this.svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);
    this.currentTransform = d3.zoomIdentity;
  }

  simulationRunning = true;
  addSvgClickListener = () => {
    this.svg.on("click", () => {
      if (this.simulationRunning) {
        this.simulation.stop();
        this.simulationRunning = false;
      } else {
        this.simulation.restart();
        this.simulationRunning = true
      }
    });
  }

  removeSvgClickListener = () => {
    this.svg.on("click", null);
  }

  isLazoEnabled = false;

  toggleLazo() {
    this.isLazoEnabled = !this.isLazoEnabled
    if (this.isLazoEnabled) {
      const selectionBox = this.svg.append("rect") 
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-dasharray", "4")
        .style("pointer-events", "none")
        .style("opacity", 0);

      let startX, startY;
      let transform = d3.zoomTransform(this.svg.node());

      this.svg.on("contextmenu", (event) => {
        event.preventDefault();
      });

      this.svg.on("mousedown", () => {
        transform = d3.zoomTransform(this.svg.node());
        const [x, y] = d3.pointer(event);
        startX = x;
        startY = y;
        selectionBox
          .attr("x", startX)
          .attr("y", startY)
          .attr("width", 0)
          .attr("height", 0)
          .style("opacity", 0.5);
      });

      this.svg.on("mousemove", (event) => {
        if (startX !== undefined && startY !== undefined) {
          const [x, y] = d3.pointer(event);
          selectionBox
            .attr("width", Math.abs(x - startX))
            .attr("height", Math.abs(y - startY))
            .attr("x", Math.min(startX, x))
            .attr("y", Math.min(startY, y));
        }
      });

      this.svg.on("mouseup", (event) => {
        let self = this;
        let boxX = parseFloat(selectionBox.attr("x"));
        let boxY = parseFloat(selectionBox.attr("y"));
        let boxWidth = parseFloat(selectionBox.attr("width"));
        let boxHeight = parseFloat(selectionBox.attr("height"));

        this.nodeGroups.filter(function (d) {

          const node = d3.select(this).select("circle");
          let nodeX = parseFloat(node.attr("cx"));
          let nodeY = parseFloat(node.attr("cy"));
          const nodeRadius = parseFloat(node.attr("r"));

          const [transformedX, transformedY] = transform.apply([nodeX, nodeY]);
          const transformedRadius = nodeRadius * transform.k;

          if (transformedX + transformedRadius > boxX &&
            transformedX - transformedRadius < boxX + boxWidth &&
            transformedY + transformedRadius > boxY &&
            transformedY - transformedRadius < boxY + boxHeight) {
            handleMouseClickNodes(d, self, d3, false)
          }
        });
        selectionBox.style("opacity", 0);
        startX = undefined;
        startY = undefined;
      });
    } else {
      this.svg.on("contextmenu", null).on("mousedown", null).on("mouseup", null).on("mousemove", null)
    }
  }


  //---SIMULATIONs---//
  initializeSimulation() {
    this.simulation = d3.forceSimulation(this.data.nodes);
    this.setForceDirectedSimulationForce();
  }
  saveInitialNodesPositions() {
    this.data.nodes.forEach(node => {
      node.initialX = node.x;
      node.initialY = node.y;
    });
  }
  restartFromInitialPositions() {
    this.data.nodes.forEach(node => {
      node.x = node.initialX;
      node.y = node.initialY;
    });
  }

  resetGroupedNodes() {
    let self = this;
    if (this.groupedNodes) {
      this.nodes.style("display", "block").on("click", function (e, d) {
        handleMouseClickNodes.call(this, d, self, d3, true);
      })
      this.links.style("display", "block")
      this.groupedLinks.remove();
      this.groupedNodes.remove()
      this.groupedLinks = null;
      this.groupedNodesbyToi = null;
      this.groupedNodes = null;
    }
  }

  toggleLegends() {
    if (this.geoLayout) {
      this.legendToi.style("visibility", "hidden")
      this.svg.select("#legendEdgeWidth").style("visibility", "hidden")
      this.svg.select('#legendToiGeo').style("visibility", "visible")
      this.legendDistrict.style("visibility", "visible")
    }
    else {
      this.legendToi.style("visibility", "visible")
      this.svg.select("#legendEdgeWidth").style("visibility", "visible")
      this.svg.select('#legendToiGeo').style("visibility", "hidden")
      this.legendDistrict.style("visibility", "hidden")
    }
  }

  toggleGeoLayout() { //switch between views
    this.geoLayout = !this.geoLayout;
    this.simulation.stop();
    this.resetZoom();
    this.toggleLegends()
    if (this.geoLayout) {
      this.removeSvgClickListener();
      this.resetGroupedNodes();

      if (this.adjacentLinks != null) {
        this.links.style('visibility', 'hidden');
        this.adjacentLinks
          .style('visibility', 'visible')
          .attr("stroke", adjacentColor)
          .attr("stroke-opacity", "100%");
      } else {
        if (this.areEdgesShowed) this.toggleEdges()
      }

      this.setGeoLayoutSimulationForce();

      this.simulation.alpha(2).alphaDecay(0.05).alphaMin(0.1).restart();
      this.simulation.on("end", () => {
        this.mapUmbria.style("visibility", "visible")
        this.simulation.on("tick", null)
      })
    }
    else {

      if (!this.areEdgesShowed) this.toggleEdges()
      if (this.adjacentLinks != null) this.links.style("visibility", d => (d.weight * 100 < this.tresholdLinks) ? 'hidden' : 'visible')

      this.mapUmbria.style("visibility", "hidden")

      this.addSvgClickListener();

      this.isPCALayout = !this.isPCALayout
      this.togglePCACoordinates()
    }

  }

  forceCustomGeo(alpha) {
    let self = this;
    return function force() {
      for (const node of self.data.nodes) {
        node.vx += (node.geoX - node.x) * alpha * 0.5;
        node.vy += (node.geoY - node.y) * alpha * 0.5;
      }
    };
  }

  setGeoLayoutSimulationForce() {
    const self = this;
    this.simulation
      .force('link', null)  //remove force that controls the distance between nodes
      .force("charge", null)
      .force("collide", d3.forceCollide().strength(1).radius(maxRadiusNodes).iterations(2))
      .force('geo', self.forceCustomGeo(1))
      .force("center", null)
      .force("x", null)
      .force("y", null)
      .force("targetX", null)
      .force("targetY", null)
      .on("tick", () => this.ticked());
    this.specificTois = [];
    this.tois.forEach(toi => {
      this.simulation
        .force(`attractToCenter-${toi.id}`, null);
    }
    );
  }

  toggleEdges() {
    if (this.areEdgesShowed) {
      this.links.style("visibility", "hidden");
    }
    else {
      if (this.geoLayout && this.adjacentLinks != null) {
        this.adjacentLinks.style("visibility", d => (d.weight * 100 < this.tresholdLinks) ? 'hidden' : 'visible')
      }
      else
        this.links.style("visibility", d => (d.weight * 100 < this.tresholdLinks) ? 'hidden' : 'visible')
    }

    this.areEdgesShowed = !this.areEdgesShowed;
    this.updateInstruction()
  }

  setForceDirectedSimulationForce = () => {
    this.simulation
      .force("link", d3.forceLink(this.data.links)
        .id(function (d) { return d.id; })
        .distance((d) => {
          const weightFactor = (d.weight * 100 - this.tresholdLinks) / (100 - this.tresholdLinks);
          const distance = 20 * (1 - weightFactor);  
          return distance;
        })
      )
      .force("collide", d3.forceCollide().strength(1.2).radius(5).iterations(1))
      .force("charge", d3.forceManyBody().strength(-17).distanceMin(0.5))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX().strength(0.11))
      .force("y", d3.forceY().strength(0.25))
      .force('geo', null)
      .force("targetX", null)
      .force("targetY", null)
      .on("tick", () => this.ticked())
      .on("end", () => {
        calculateEntropy(this.data.nodes, false)
      })
     
    this.tois.forEach(toi => {
      if (!this.specificTois.includes(toi.id)) {
        this.simulation
          .force(`attractToCenter-${toi.id}`, null);
      }
    });
  };
  private positionsSaved = false;

  ticked() {
    if (this.groupedNodes) {
      this.groupedNodes
        .attr('cx', (d: any) => {
          return d.x;
        })
        .attr("cy", d => {
          return d.y;
        });
    }
    if (this.groupedLinks) {
      this.groupedLinks
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
    }
    if (!this.positionsSaved) {
      this.saveInitialNodesPositions();
      this.positionsSaved = true;
    }
    this.nodes
      .attr('cx', (d: any) => {
        return d.x;
      })
      .attr('cy', (d: any) => {
        return d.y;
      });

    this.svg.selectAll(".links").style("visibility", "visible")
    this.svg.selectAll(".boundledLinks").remove()
    this.links
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    if (!this.areLabelHidden) this.showSelectedLabels();

  }

  zoomed = (e) => {
    this.mapUmbria.attr("transform", e.transform)
    this.nodes.attr("transform", e.transform);
    this.links.attr("transform", e.transform);
    if (this.groupedNodes) {
      this.groupedNodes.attr("transform", e.transform);
    }
    if (this.groupedLinks) {
      this.groupedLinks.attr("transform", e.transform);
    }
    this.currentTransform = e.transform;
    if (!this.areLabelHidden) this.showSelectedLabels()
  }

  dragstarted = (event: any, d: any) => {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged = (event: any, d: any) => {
    d.fx = event.x;
    d.fy = event.y;
  }

  dragended = (event: any, d: any) => {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  //---------------------------------------------LABELS------------------------------------------------------------------------//
  updateLabelSize() {
    if (!this.areLabelHidden) this.showSelectedLabels()
  }

  showLabel(label: any, i: number, right: boolean, leftX) {
    const textElement = label.select("text");
    const rectElement = label.select("rect");

    textElement.style("font-size", this.labelSize)
      .attr("fill", (d) => {
      return this.saturatedToiColor[this.tois.map(el => el.id).findIndex((e) => e === d.toi)] == '#ffff33' ? "black" :this.saturatedToiColor[this.tois.map(el => el.id).findIndex((e) => e === d.toi)] == '#00fa11'?"black": "white";
      }
      )
    let tooltipWidth = textElement.node().getComputedTextLength() + 10;

    rectElement
      .attr("width", tooltipWidth)
      .attr("height", this.labelSize + 4)
      .attr("fill", (d) => {
      return this.saturatedToiColor[this.tois.map(el => el.id).findIndex((e) => e === d.toi)];
      })
      .attr("fill-opacity", 0.70);

    textElement
      .attr("x", tooltipWidth / 2)
      .attr("y", (this.labelSize + 4) / 2 +1)

    let node = this.nodeGroups.filter(node => node.id == label.datum().id);
    if (this.geoLayout) {
      const nodeData = node.select("circle").datum();

      let labelX, labelY;
      if (right) {
        labelX = 600;
        labelY = i * (this.labelSize + 6) + this.svg.select('#dynamicTextGeoRect').node().getBBox().height + 10
        label.attr("transform", `translate(${labelX}, ${labelY})`)
          .style("visibility", "visible");
      } else {
        labelX = leftX - tooltipWidth + 10;
        labelY = i * (this.labelSize + 6) + this.svg.select('#instructionText').node().getBBox().height +10
        label.attr("transform", `translate(${leftX - tooltipWidth + 10}, ${labelY})`)
          .style("visibility", "visible").raise();
      }

      const line = node.select(".leaderLine");

      line.attr("x1", this.currentTransform.applyX(nodeData.x))
        .attr("y1", this.currentTransform.applyY(nodeData.y))
        .attr("x2", right ? labelX : leftX + 10)
        .attr("y2", (labelY) + (this.labelSize + 6) / 2)
        .style("visibility", "visible")
    } else {
      node.select(".leaderLine").style("visibility", "hidden")
      label.attr(
        "transform", (d) => {
          const x = this.currentTransform ? this.currentTransform.applyX(d.x) : d.x;
          const y = this.currentTransform ? this.currentTransform.applyY(d.y) : d.y;

          return `translate(${x}, ${y - (this.labelSize + 4)})`;
        }).style("visibility", "visible");
    }

  }

  removeLabel(nodeGroup) {
    const label = this.labels.filter(label => label.id == nodeGroup.data()[0].id)
    this.showedLabels = this.showedLabels.filter(item =>
      item.node() !== label.node()
    );
    nodeGroup.select(".leaderLine").style("visibility", "hidden")
    label.style("visibility", "hidden")
  }

  leftStartIndex = 0;
  rightStartIndex = 0;
  leftLabels = []
  rightLabels = []

  showSelectedLabels = () => {
    this.areLabelHidden = false;

    //reset labels
    this.nodeGroups.select(".leaderLine").style("visibility", "hidden")
    this.svg.selectAll(".label").style("visibility", "hidden")
    //end reset label

    if (this.showedLabels.length > 0) {
      if (!this.geoLayout) {
        this.showedLabels.forEach((e, i) => {
          this.showLabel(e, i, null, null)
        })
      } 
      else { 
        const visiblePoints = this.showedLabels.filter(d => { 
          const transformedX = this.currentTransform.applyX(d.datum().x);
          const transformedY = this.currentTransform.applyY(d.datum().y);
          return transformedX >= 180 && transformedX <= 600 && transformedY >= 0 && transformedY <= mapHeight;
        });

        this.leftLabels = visiblePoints.filter(e => e.datum().x < (width - 40) / 2)
          .sort((a, b) => {
            return a.datum().y - b.datum().y
            const yComparison = a.datum().y - b.datum().y;
            const xComparison = a.datum().y - b.datum().y;
            return (Math.abs(yComparison) < 10 && Math.abs(xComparison) > 20) ? xComparison : yComparison;
          });

        this.rightLabels = visiblePoints.filter(e => e.datum().x >= (width - 40) / 2)
          .sort((a, b) => {
            return a.datum().y - b.datum().y
            const yComparison = a.datum().y - b.datum().y;
            const xComparison = a.datum().x - b.datum().x;
            return (Math.abs(yComparison) < 10 && Math.abs(xComparison) > 20) ? -xComparison : yComparison;
          });

        const leftToShow = this.leftLabels.slice(this.leftStartIndex, this.leftStartIndex + labelToShow);
        let textLength = 180;
        const rightToShow = this.rightLabels.slice(this.rightStartIndex, this.rightStartIndex + labelToShow);

        leftToShow.forEach((e, i) => {
          this.showLabel(e, i, false, textLength);
        });

        rightToShow.forEach((e, i) => {
          this.showLabel(e, i, true, null);
        });
      }
    } else {
      this.leftLabels = [];
      this.rightLabels = [];
      this.leftStartIndex = 0;
      this.rightStartIndex = 0;
    }
  }

  adjustLabelPositions(labels) {
    if (labels.length == 1) {
      labels[0].datum().yLabel = labels[0].datum().y;
    }
    for (let i = 1; i < labels.length; i++) {
      const prevLabel = labels[i - 1];
      const currLabel = labels[i];
      if (currLabel.datum().yLabel == undefined) currLabel.datum().yLabel = currLabel.datum().y;
      else currLabel.datum().yLabel = currLabel.datum().yLabel;
      if (prevLabel.datum().yLabel == undefined) prevLabel.datum().yLabel = prevLabel.datum().y
      else prevLabel.datum().yLabel = prevLabel.datum().yLabel

      if (currLabel.datum().y - prevLabel.datum().y < (this.labelSize + 4) + 5) {
        currLabel.datum().yLabel = prevLabel.datum().yLabel + this.labelSize + 4 + 5;
      }
    }
  }

  showNextLabels = () => {
    if (this.leftStartIndex + labelToShow < this.leftLabels.length) {
      this.leftStartIndex += labelToShow;
      if (!this.areLabelHidden) this.showSelectedLabels();
    }
    if (this.rightStartIndex + labelToShow < this.rightLabels.length) {
      this.rightStartIndex += labelToShow;
      if (!this.areLabelHidden) this.showSelectedLabels();
    }
  }

  showPreviousLabels = () => {
    if (this.leftStartIndex > 0) {
      this.leftStartIndex -= labelToShow;
      if (!this.areLabelHidden) this.showSelectedLabels();
    }
    if (this.rightStartIndex > 0) {
      this.rightStartIndex -= labelToShow;
      if (!this.areLabelHidden) this.showSelectedLabels();
    }

  }

  hideSelectedLabels = () => {
    this.areLabelHidden = true;
    this.showedLabels.forEach((e) => {
      e.style("visibility", "hidden");
    });
    this.nodeGroups.select(".leaderLine").style("visibility", "hidden")
  }

  removeAllLabel = () => {
    this.showedLabels.forEach((e) => {
      e.style("visibility", "hidden")
    });
    this.nodeGroups.select(".leaderLine").style("visibility", "hidden")
    this.showedLabels = [];
  }

  updateLinks() {
    this.links
      .attr('stroke-width', (d: any) => (d.weight * 100 - this.tresholdLinks) / (100 - this.tresholdLinks) * 3)
      .style('display', d => (d.weight * 100 < this.tresholdLinks) ? 'none' : 'block');
    d3.select("#minTresholdLinksLegend").text(this.tresholdLinks + "%")
    d3.select("#middleTresholdLinksLegend").text((100 + this.tresholdLinks) / 2 + "%")

    this.svg.selectAll(".tooltip-source").raise();
    this.svg.selectAll(".tooltip-target").raise();
    this.svg.selectAll(".label").raise()
    if (this.nodeAdjLinkClicked != null) {
      this.nodeAdjLinkClicked.forEach(d => {
        handleMouseClickNodes(d, this, d3, true)
      });

    }
    if (!this.geoLayout)
      this.updateFD();
  }

  updateFD() {
    const filteredLinks = this.data.links.filter((d: any) => d.weight * 100 > this.tresholdLinks);
    this.simulation
      .force("link", d3.forceLink(filteredLinks)
        .id(function (d) { return d.id; })
        .distance((d) => {
          const weightFactor = (d.weight * 100 - this.tresholdLinksMin) / (100 - this.tresholdLinksMin);
          const distance = 20 * (1 - weightFactor);
          return distance;
        }))
    this.restartFromInitialPositions();
    this.simulation.alpha(1.8).alphaDecay(0.1).restart();
  }

  //Search POI from List ----------------------------------------------------------------------------------------------------------
  toggleAllPois(toiId: number, isChecked: boolean) {
    const pois = this.poiToiMap.get(toiId);

    if (pois) {
      pois.forEach(poi => {
        this.togglePoi(poi, isChecked, true);
      });
      if (!this.areLabelHidden) this.showSelectedLabels();
      if(this.clickedNodes!=null){
        if (this.clickedNodes.length === 0) {
          this.hideBarChart();
          this.closeParallelCoordinates();
          this.clickedNodes = null
          this.nodesToHighlight = null
        } else if (this.clickedNodes.length == 1) {
          this.closeParallelCoordinates();
          this.showBarChart(this.clickedNodes[0]);
        } else {
          this.showParallelCoordinatesChart(this.clickedNodes);
        }
      }
      
    }

  }

  togglePoi(poi: any, isChecked: boolean, toggleAll: boolean) {
    const nodeGroup = this.getNodeGroupForPoi(poi.id);
    if (nodeGroup) {
      if (isChecked) {
        if (!this.clickedNodes) this.clickedNodes = []
        this.toiSelection[poi.toi] += 1;
        this.clickedNodes.push(poi);
        if (!this.nodesToHighlight) {
          this.nodesToHighlight = nodeGroup;
        } else {
          this.nodesToHighlight = this.svg.selectAll(() => [
            ...this.nodesToHighlight.nodes(),
            ...nodeGroup.nodes()
          ]);
        }
        nodeGroup.select("circle").style("opacity", 1).style("stroke", clickedNodeColor);
        const label = this.labels.filter(label => label.id == nodeGroup.data()[0].id)
        if (label) {
          this.showedLabels.push(label)
        }
        if (!toggleAll && !this.areLabelHidden) this.showSelectedLabels()
      } else {
        if (this.isPoiSelected(poi)) {
          const nodeIndex = this.clickedNodes.findIndex(node => node.id === poi.id);
          this.clickedNodes.splice(nodeIndex, 1);

          this.toiSelection[poi.toi] -= 1;
          this.nodesToHighlight = this.nodesToHighlight.filter((node) => node.id != nodeGroup.data()[0].id);
          if (poi.adjacentNodes && poi.adjacentLinks) {
            poi.adjacentNodes.forEach(node => {
              this.removeLabel(d3.select(`#node-${node.id}`))
              d3.select(`#node-${node.id}`).style("opacity", defaultNodeOpacity)
                .attr("stroke", defaultNodeStroke);
            })
            poi.adjacentLinks.attr("stroke", defaultLinkColor)
              .attr("stroke-opacity", defaulfLinkOpacity);
            const poiLinksSet = new Set(poi.adjacentLinks.nodes());
            this.adjacentLinks = this.adjacentLinks.filter(function (d, i, nodes) {
              return !poiLinksSet.has(nodes[i]);
            });

          }
          nodeGroup.select("circle").style("opacity", defaultNodeOpacity).style("stroke", defaultNodeStroke);
          this.removeLabel(nodeGroup)
        }
      }
      if (!toggleAll) {
        if (this.clickedNodes.length === 0) {
          this.hideBarChart();
          this.closeParallelCoordinates();
          this.clickedNodes = null;
          this.nodesToHighlight = null
        } else if (this.clickedNodes.length == 1) {
          this.closeParallelCoordinates();
          this.showBarChart(this.clickedNodes[0]);
        } else {
          this.showParallelCoordinatesChart(this.clickedNodes);
        }
      }
    }
  }

  getNodeGroupForPoi(poiId: number) {
    return this.nodeGroups.filter((d: any) => d.id === poiId);
  }

  deselectAllPois() {
    resetLayout(this)
    this.clickedNodes = null;
    this.hideBarChart()
    this.closeParallelCoordinates()
  }

  isPoiSelected(poi: any): boolean {
    if (this.clickedNodes) {
      return this.clickedNodes.map(el => el.id).includes(poi.id)
    }
    return false;
  }

  //searchPOI//-----------------------------------------------------------------------------------------------

  isSearchPoi = false;
  onPoiSearchSelected(selectedPoi: any): void {
    if (!this.isSearchPoi) {
      resetLayout(this)
      this.isSearchPoi = true;
    }
    const nodeGroup = this.getNodeGroupForPoi(selectedPoi.id);
    if (nodeGroup) {
      handleMouseClickNodes(selectedPoi, this, d3, false)
      if (!this.areLabelHidden) this.showSelectedLabels()
    }
  }

  isPoiOnSearchBar(): boolean {
    return this.filteredPois.some(poi => poi.name === this.searchControl.value);
  }


  openHandlePoi() {
    this.appUtilService.goLink(`admin/handle-poi?poiName=${encodeURIComponent(this.searchControl.value)}`);
  }

 
     onVisibleToiChange(event) {
      const notVisibleNodeIds = this.nodes.data().filter(node => !this.visibleTOIs.includes(node.toi)).map(node => node.id);
      const notVisibleLinks = this.links.filter(link =>
        notVisibleNodeIds.includes(link.source.id) || notVisibleNodeIds.includes(link.target.id)
      );

        this.svg.selectAll('.node-group').style('opacity', (d) =>
           notVisibleNodeIds.includes(d.id) ? 0 : 1);
  
       this.links
        .style("display", "block");
  
      notVisibleLinks
        .style("display", "none");
  
        this.showedLabels.forEach((e) => { 
          e.style("visibility", ()=> notVisibleNodeIds.includes(e.datum().id) ? "hidden": "visible")
        });
  
    }

    
  onToiColorChange(event) {
    const notVisibleNodeIds = this.nodes.data().filter(node => !this.visibleColorTOIs.includes(node.toi)).map(node => node.id);
    let self=this;
    this.nodes.style("fill", function(d) {
          const scores = d.scores.map((score, index) => 
            self.visibleColorTOIs.includes(index + 1) ? score : 0
        );
          const maxIndex = scores.reduce((maxIdx, num, idx, arr) => 
            num > arr[maxIdx] ? idx : maxIdx, 0);
          
         return self.saturatedToiColor[self.tois.map(el => el.id).findIndex((e) => e === (maxIndex+1))]
      }).attr('r', (d) => {  
        const scores = d.scores.map((score, index) => 
          self.visibleColorTOIs.includes(index + 1) ? score : 0
      );
        const maxIndex = scores.reduce((maxIdx, num, idx, arr) => 
          num > arr[maxIdx] ? idx : maxIdx, 0);
        const score = d.scores[this.tois.map(el => el.id).findIndex((e) => e === (maxIndex+1))];
        const toiMM = this.toiMinMax.filter((el) => el.toi ==  (maxIndex+1))[0]
        let adjustedRadius;
        if(score<toiMM.min){
          adjustedRadius=minRadiusNodes;
        }else{
          const normalizedScore = (score - toiMM.min) / (toiMM.max - toiMM.min);            
          adjustedRadius = minRadiusNodes + Math.sqrt(normalizedScore) * (maxRadiusNodes - minRadiusNodes); 
        }
        return Math.min(Math.max(adjustedRadius, minRadiusNodes), maxRadiusNodes); 
  })
}

  getToiName(id: number): string {
    return this.tois.find(toi => toi.id === id)?.name || '';
  }

  removeLinksWithSameToi = false

  onRemoveLinksToggleChange(event) {
    if (this.removeLinksWithSameToi) {
      this.links.filter(link => link.source.toi == link.target.toi).style("display", "none");
      resetLayout(this)
      console.log(this.clickedNodes)
      let nodes=this.clickedNodes;
      this.clickedNodes=null;
      nodes.forEach(node=>
        handleMouseClickNodes(node, this, d3, true)
      )      
    } else {
      this.links.style("display", "block");
      resetLayout(this)
      let nodes=this.clickedNodes;
      this.clickedNodes=null;
      nodes.forEach(node=>
        handleMouseClickNodes(node, this, d3, true)
      )      
    }
  }



}
