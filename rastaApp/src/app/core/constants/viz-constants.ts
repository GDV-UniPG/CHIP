
  //Umbria latitude, longitude
  export const latMin = 42.36;
  export const latMax = 43.62;
  export const lonMin = 11.89;
  export const lonMax = 13.26;

  export const density=20; //average number of edges per node
  
 
  export const mapWidthPx=1096;
  export const mapHeightPx=1330;


  //svg width and height
  export const width = 800;
  export const height = 420;

  
  export const poisRectWidth = width * 0.28; 
  export const poisRectHeight = height * 0.35;
  
  export const mapHeight= height-25;

  export const translateX = (width - mapWidthPx * (mapHeight) / mapHeightPx) / 2;
  export const mapAspectRatio = mapWidthPx / mapHeightPx;
  export const svgAspectRatio = width / (mapHeight);
  export const scaleY = 1;
  export const scaleX = mapAspectRatio / svgAspectRatio;

  //link colors
  export const defaultLinkColor = "#6d6d6d";
  export const defaulfLinkOpacity="30%"
  export const highlightlinkColor = "#222";
  export const adjacentColor = "#444";
  export const clickedNodeColor="black";
  export const defaultNodeStroke= "#4d4d4d"

  export const fontSize = 6;

  export const tooltipWidth = 30;
  export const tooltipHeight = 20;

  export const defaultNodeOpacity=0.7
  export const defaultGroupedNodeOpacity=0.95

  export const umbriaDistricts=[
    {name:"Alta valle del Tevere", latitude:43.3679222, longitude:12.2367958},
    {name:"Gubbio", latitude: 43.3517605, longitude:12.5772959},
    {name:"Perugia", latitude:43.1119613, longitude:12.3890104},
    {name:"Lago Trasimeno", latitude:43.1316, longitude:12.1117},
    {name:"Assisi", latitude: 43.0711952, longitude: 12.6146669},
    {name:"Foligno", latitude:42.9559744, longitude:12.7034782},
    {name:"Orvieto", latitude:42.7186152, longitude:12.1087907},
    {name:"Todi", latitude: 42.7824434, longitude:12.4062554},
    {name:"Spoleto", latitude:42.7342971, longitude:12.7382035},
    {name:"Valnerina", latitude:42.7704, longitude:13.0489},
    {name:"Amelia", latitude:42.5535279, longitude:12.4167756},
    {name:"Terni", latitude:42.5641417, longitude:12.6405466}]
  export const umbriaDistrictsColors=[
    "#18B59B",
    "#2D917E",
    "#EBB07A",
    "#B2A124",
    "#C4224C",
    "#F47A01",
    "#ffdd51",
    "#B98AC0", 
    "#8DA0AC", 
    "#E6BDA9", 
    "#C2E981",
    "#A3A382"
  ]
  export const purple = "#6465aa";

  export const maxRadiusNodes=4.8;
  export const minRadiusNodes=2.5;
  export const paddingLegend=10;
  export const labelToShow=30;