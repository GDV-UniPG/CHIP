import { tooltipWidth, tooltipHeight, defaultLinkColor, defaultNodeOpacity, purple, defaultNodeStroke, width, height } from "src/app/core/constants/viz-constants";
import similarity from 'compute-cosine-similarity';


export function filterPois(poiName: string, self): void { //search poi by name
  if (!poiName || poiName.trim() === '') {
    self.filteredPois = [];
  } else {
    self.filteredPois = self.data.nodes.filter(poi =>
      poi.name.toLowerCase().includes(poiName.toLowerCase())
    );
  }
}

export function createTooltip(self) {
  let tooltipSource = self.svg
    .append("g")
    .attr("class", "tooltip-source")
    .style("opacity", 0);

  tooltipSource
    .append("rect")
    .attr("height", tooltipHeight)
    .attr("rx", 3)
    .attr("ry", 3)
    .attr("fill", purple)
    .attr("fill-opacity", 0.80);

  tooltipSource
    .append("text")
    .attr("y", tooltipHeight / 2 + 1)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("fill", "white")
    .style("font-weight", 200)
    .style("font-size", "10px");

  let tooltipTarget = self.svg
    .append("g")
    .attr("class", "tooltip-target")
    .style("opacity", 0);

  tooltipTarget
    .append("rect")
    .attr("height", tooltipHeight)
    .attr("rx", 3)
    .attr("ry", 3)
    .attr("fill", purple)
    .attr("fill-opacity", 0.80);

  tooltipTarget
    .append("text")
    .attr("y", tooltipHeight / 2 + 1)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("fill", "white")
    .style("font-weight", 200)
    .style("font-size", "10px");
};

export function resetLayout(self) {
  self.removeAllLabel();
  if (self.isSearchPoi) {
    self.searchControl.setValue('');
    self.isSearchPoi = false;
  }
  self.leftLabels = [];
  self.rightLabels = []
  self.leftStartIndex = 0;
  self.rightStartIndex = 0;
  resetNodes(self);
  resetLinks(self);
  resetToiSelection(self)
}
export function resetNodes(self) {
  if (self.nodesToHighlight)
    self.nodesToHighlight.select("circle").style("opacity", defaultNodeOpacity).style("stroke", defaultNodeStroke)
  self.nodesToHighlight = null;
  self.nodeAdjLinkClicked = null;
}
export function resetLinks(self) {
  if (self.adjacentLinks)
    self.adjacentLinks.attr("stroke", defaultLinkColor).attr("stroke-opacity", "30%").attr('stroke-width', (d: any) => { return (d.weight * 100 - self.tresholdLinks) / (100 - self.tresholdLinks) * 3 })
  if (self.geoLayout && self.areEdgesShowed) {
    self.links.style('visibility', 'visible')
  }
  if (self.isPCALayout && !self.geoLayout) self.links.style('visibility', 'hidden')
  self.adjacentLinks = null
}
function resetToiSelection(self) {
  for (let key in self.toiSelection) {
    self.toiSelection[key] = 0;
  }
}

export function dijkstraWithLinks(nodes, links, startId, targetId) {
  const distances = {};
  const previous = {};
  const pathLinks = {};
  const queue = [];

  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    pathLinks[node.id] = null;
  });
  distances[startId] = 0;

  queue.push({ id: startId, distance: 0 });
  let weight = 0;
  let i = 0;
  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const { id: currentId } = queue.shift();

    if (currentId === targetId) {
      const path = [];
      let shortestPathLinks = [];
      let step = targetId;

      while (step) {

        path.unshift(step);
        step = previous[step];
        weight += queue[i].distance;
        i++;
      }

      step = targetId;
      while (previous[step]) {
        const sourceId = previous[step];
        const targetId = step;
        const link = links.filter((link) => {
          return (link.source.id === sourceId && link.target.id === targetId) ||
            (link.source.id === targetId && link.target.id === sourceId);
        }).node();
        shortestPathLinks.unshift(link);
        step = previous[step];
      }
      return { path, shortestPathLinks, weight };
    }

   
    const neighbors = links.data()
      .filter(
        link => link.source.id === currentId || link.target.id === currentId)
      .map(link => ({
        id: link.source.id === currentId ? link.target.id : link.source.id,
        weight: 1 - link.weight,
        link
      }));

   
    neighbors.forEach(({ id: neighborId, weight, link }) => {
      const newDist = distances[currentId] + weight;

      if (newDist < distances[neighborId]) {
        distances[neighborId] = newDist;
        previous[neighborId] = currentId;
        pathLinks[neighborId] = link;

      
        const existingNode = queue.find(node => node.id === neighborId);
        if (existingNode) {
          existingNode.distance = newDist;
        } else {
          queue.push({ id: neighborId, distance: newDist });
        }
      }
    });
  }
  return null;
}

export function calculateMaxMinPerToi(nodes, self) {
  const toiGroups = {};
  nodes.forEach(node => {
    const toi = node.toi;
    const scores = node.scores
    if (!toiGroups[toi]) {
      toiGroups[toi] = [];
    }
    toiGroups[toi].push(scores[self.tois.map(el => el.id).findIndex((e) => e === toi)]);
  });
  for (const toi in toiGroups) {
    const scoresList = toiGroups[toi];
    const flattenedScores = scoresList.flat();
    const maxScore = Math.max(...flattenedScores);
    const minScore = Math.min(...flattenedScores);
    self.toiMinMax.push({
      toi: parseInt(toi),
      max: maxScore,
      min: minScore
    });
  }
}


import PCA from 'pca-js';
export function coputePCACoordinates(nodes, toiSelectionForSimilarity) {
  const selectedIndices = Object.values(toiSelectionForSimilarity);

  const data = nodes.map(el => el.scores.filter((value, index) => selectedIndices[index]));
  const result = PCA.getEigenVectors(data); 

  let reducedData = [PCA.computeAdjustedData(data, result[0]).adjustedData, PCA.computeAdjustedData(data, result[1]).adjustedData];

  var topTwo = PCA.computePercentageExplained(result,result[0],result[1])
  console.log(`Varianza spiegata dalle due direzioni: ${(topTwo)}%`); 


  const xData = (reducedData[0])[0]
  const yData = (reducedData[1])[0]

  const minX = Math.min(...xData);
  const maxX = Math.max(...xData);
  const minY = Math.min(...yData);
  const maxY = Math.max(...yData);

  const scaleX = (width - 40) / (maxX - minX);
  const scaleY = (height - 40) / (maxY - minY);

  const scaledTranslatedX = xData.map(x => (x - minX) * scaleX + 20);
  const scaledTranslatedY = yData.map(y => (y - minY) * scaleY + 20);


  reducedData = [scaledTranslatedX, scaledTranslatedY]


  nodes.forEach((node, i) => {
    node.targetX = reducedData[0][i];
    node.targetY = reducedData[1][i];
  });

}

export function computeLinks(pois, density, treshold, toiSelectionForSimilarity): { links: any[], minSimilarity: number, maxSimilarity: number, densities: any[] } {
  let links = [];
  const selectedIndices = Object.values(toiSelectionForSimilarity);
  const selectedCount = selectedIndices.filter(Boolean).length;
  if (density) {
    const maxEdges = Math.floor(density * pois.length); 
    const possibleLinks = [];

    for (let i = 0; i < pois.length; i++) {
      const filteredScoresVectorA = pois[i].scores_vector.filter((value, index) => selectedIndices[index]);

      for (let j = i + 1; j < pois.length; j++) {
        const filteredScoresVectorB = pois[j].scores_vector.filter((value, index) => selectedIndices[index]);

        let sim;
        if (selectedCount === 1) {
          sim = 1 - Math.abs(filteredScoresVectorA[0] - filteredScoresVectorB[0]);
        } else {
          sim = similarity(filteredScoresVectorA, filteredScoresVectorB);
        }
        if (sim > 0) {
          possibleLinks.push({
            source: pois[i].id,
            target: pois[j].id,
            weight: sim
          });
        }
      }
    }
    possibleLinks.sort((a, b) => b.weight - a.weight);

    links = possibleLinks.slice(0, maxEdges);


    const minSim = links.length > 0 ? Math.min(...links.map(link => link.weight)) : 0;
    const maxSim = links.length > 0 ? Math.max(...links.map(link => link.weight)) : 0;
    const similarityStep = 0.01;
    const densities = [];

    for (let simThreshold = minSim; simThreshold <= 1; simThreshold += similarityStep) { 
      const filteredLinks = links.filter(link => link.weight >= simThreshold);
      const density = filteredLinks.length / pois.length;

      densities.push({
        similarity: simThreshold,
        density: density
      });
    }
    return {
      links,
      minSimilarity: minSim,
      maxSimilarity: maxSim,
      densities
    };
  } else {
    for (let i = 0; i < pois.length; i++) {
      const filteredScoresVectorA = pois[i].scores_vector.filter((value, index) => selectedIndices[index]);

      for (let j = i + 1; j < pois.length; j++) {
        const filteredScoresVectorB = pois[j].scores_vector.filter((value, index) => selectedIndices[index]);

        let sim;
        if (selectedCount === 1) {
          sim = 1 - Math.abs(filteredScoresVectorA[0] - filteredScoresVectorB[0]);
        } else {
          sim = similarity(filteredScoresVectorA, filteredScoresVectorB);
        }
        if (sim > treshold) {
          links.push({
            source: pois[i].id,
            target: pois[j].id,
            weight: sim
          });
        }
      }
    }
    return {
      links,
      minSimilarity: null,
      maxSimilarity: null,
      densities: null
    };
  }
}


export function calculateEntropy(nodes, PCA) {

  const xCells = 20; 
  const yCells = 10; 
  const cellWidth = width / xCells; 
  const cellHeight = height / yCells;
 
  const nodesByTOI = {};
  nodes.forEach(node => {
    if (!nodesByTOI[node.toi]) {
      nodesByTOI[node.toi] = [];
    }
    nodesByTOI[node.toi].push(node);
  });

  for (const toi in nodesByTOI) {
 
    const grid = new Array(xCells).fill(0).map(() => new Array(yCells).fill(0));
    const toiNodes = nodesByTOI[toi];

    toiNodes.forEach(node => {
      let  xIndex, yIndex;
      if(PCA){
        xIndex = Math.floor(node.targetX / cellWidth);
       yIndex = Math.floor(node.targetY / cellHeight);
      }else{
        xIndex = Math.floor(node.x / cellWidth);
        yIndex = Math.floor(node.y / cellHeight);
      }
      grid[xIndex][yIndex]++;
    });

    const nNodes = nodes.length;
    let entropy = 0;

    grid.forEach(row => {
      row.forEach(cell => {
        const density = cell / nNodes;
        if (density > 0) {
          entropy -= density * Math.log(density);
        }
      });
    });

    console.log(toi, entropy);
  }
}

