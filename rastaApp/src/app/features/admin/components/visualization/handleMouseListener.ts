import { adjacentColor, clickedNodeColor, defaulfLinkOpacity, defaultGroupedNodeOpacity, defaultLinkColor, defaultNodeOpacity, defaultNodeStroke, highlightlinkColor, purple} from "src/app/core/constants/viz-constants";
import { resetLayout } from "./util";

export function handleMouseLeaveNodes(el, d, self, d3, isLink) {
  if (self.nodesToHighlight == null) {
    d3.select(el).style("opacity", defaultNodeOpacity).style("stroke", defaultNodeStroke)
  }
  else if (self.nodesToHighlight.data().includes(d)) {
    if (self.clickedNodes.map(el => el.id).includes(d.id)) {
      d3.select(el).style("opacity", 2).style("stroke", clickedNodeColor)
    }
    else
      d3.select(el).style("opacity", 2).style("stroke", adjacentColor)
  } else {
    d3.select(el).style("opacity", defaultNodeOpacity).style("stroke", defaultNodeStroke)
  }

  d3.select(".tooltip-source")
    .style("opacity", 0)
    .attr("transform", `translate(1000, 1000)`);

  d3.select(".tooltip-target")
    .style("opacity", 0)
    .attr("transform", `translate(1000, 1000)`);


  if (!isLink)
    if (self.areEdgesShowed) deHighlightAdjacentOver(d, self, d3)
}

export function handleMouseEnterNode(el, d, self, d3, tooltipClass, isLink) {
  d3.select(el)
    .style("stroke", clickedNodeColor)
    .style("opacity", 1)

  // TOOLTIP
  let text = self.labels.filter((label => label.id == d.id)).select("text").data()[0].name
  const tempText = self.svg.append("text")
    .style("font-size", "10px")
    .text(text)
  let tooltipWidth = tempText.node().getComputedTextLength() + 10;

  tempText.remove();
  const tooltip = d3.select(`.${tooltipClass}`)
  tooltip.selectAll("rect").attr("width", tooltipWidth)
  tooltip.selectAll("text").attr("x", tooltipWidth / 2);
  tooltip.select("text").text(`${d.name}`);

  const cx = d3.select(el).attr("cx");
  const cy = d3.select(el).attr("cy");

  const transformedCx = self.currentTransform ? self.currentTransform.applyX(cx) : cx;
  const transformedCy = self.currentTransform ? self.currentTransform.applyY(cy) : cy;

  let yOffset = 24;

  if (tooltipClass == 'tooltip-target') {
    let sourcePosition = d3.select(".tooltip-source").attr("transform");
    let ySource, xSource, yOffsetSource;
    if (sourcePosition) {
      const matchSource = sourcePosition.match(/translate\(([^,]+),\s*([^\)]+)\)/);
      if (matchSource && matchSource[2] && matchSource[1]) {
        xSource = parseFloat(matchSource[1])
        ySource = parseFloat(matchSource[2]);
      }
    }

    let yTarget = transformedCy - yOffset;
    if (ySource > yTarget) {
      yOffset = 24
      yOffsetSource = -28
    } else {
      yOffset = -4
      yOffsetSource = 0
    }

    d3.select(".tooltip-source")
      .attr("transform", `translate(${xSource}, ${ySource - yOffsetSource})`);
  }
  tooltip.attr("transform", `translate(${transformedCx - 0.5 * tooltipWidth}, ${transformedCy - yOffset})`)
    .transition()
    .duration(200)
    .style("opacity", 1);

  if (!isLink)
    if (self.areEdgesShowed)
      highlightAdjacentOver(d, self, d3)
}

let isAllToiGrouped = false;
let toiNodesBar: { [toi: number]: { xBar: number; yBar: number; grouped: boolean } } = {} //dizionario che contiene per ogni TOI da raggruppare la posizione della x e della y (=baricentro)
let isGroupedTimerExpired = true;
let isLegendTwiceClicked: { [toiId: number]: boolean } = {};
let groupedLinksMap = new Map();

export function handleMouseClickLegendToi(d, self, d3) {
  self.svg.on("click", null);
  self.simulation.stop();
  if (!self.groupedNodesbyToi) {
    renderGroupedNodes(self, d3);
  }
  if (d === null) { //group or dissolve all tois
    if (!isAllToiGrouped) {
      isAllToiGrouped = true;
      self.specificTois = self.tois.map(toi => toi.id);  

      self.specificTois.forEach(toiId => {

        const { xBar, yBar } = calculateCenterForToi(toiId, self.nodes);
        toiNodesBar[toiId] = { xBar: xBar, yBar: yBar, grouped: false };
        self.simulation
          .force(`attractToCenter-${toiId}`, (alpha) => {
            self.nodeGroups.each(forceAttractToCenterSingle(toiId)(alpha));
          })
        isGroupedTimerExpired = false;
        setTimeout(() => {
          if (!isLegendTwiceClicked[toiId]) { 
            showGroupedNodeforTOI(self, toiId, d3)
            isGroupedTimerExpired = true;
          } else { 
            isLegendTwiceClicked[toiId] = false;
          }
        }, 4000)
      });
      self.simulation
        .alpha(1)
        .alphaDecay(0.05)
        .alphaMin(0.05)
        .restart();
    } else {
      isAllToiGrouped = false;
      self.specificTois.forEach(toiId => {
        if (!isGroupedTimerExpired) {
          isLegendTwiceClicked[toiId] = true;
        }
        else hideGroupedNodeForToi(toiId, self, d3)
      })
      self.specificTois = [];
      if (self.isPCALayout) {
        self.setPCAForce();
      } else {
        self.restartFromInitialPositions();
        self.setForceDirectedSimulationForce();
      }
      self.simulation.on('end', null).alpha(1.5).alphaDecay(0.05).alphaMin(0.01).restart();
      self.nodeGroups.selectAll('circle').on("click", (e, d) => {
        handleMouseClickNodes(d, self, d3, true)
      })

    }
  } else {
    const toiId = d.id;
    if (!self.specificTois.includes(toiId)) { 
      self.specificTois.push(toiId);

      if (self.specificTois.length == self.tois.length) isAllToiGrouped = true;

      const { xBar, yBar } = calculateCenterForToi(toiId, self.nodes);
      toiNodesBar[toiId] = { xBar: xBar, yBar: yBar, grouped: false };

      self.simulation
        .force(`attractToCenter-${toiId}`, (alpha) => {
          self.nodeGroups.each(forceAttractToCenterSingle(toiId)(alpha));
        })
        .alpha(1).alphaDecay(0.05).alphaMin(0.1)
        .restart();
      isGroupedTimerExpired = false;
      setTimeout(() => {
        if (!isLegendTwiceClicked[toiId]) {
          showGroupedNodeforTOI(self, toiId, d3)
          isGroupedTimerExpired = true;
        }
        else {
          isLegendTwiceClicked[toiId] = false;
        }
      }, 4000)
    } else {
      const index = self.specificTois.indexOf(toiId);

      if (!isGroupedTimerExpired) {
        isLegendTwiceClicked[toiId] = true;
      }
      else hideGroupedNodeForToi(toiId, self, d3);

      self.specificTois.splice(index, 1);
      self.simulation
        .force(`attractToCenter-${toiId}`, null)
        .on('end', null)
        .alpha(1)
        .restart()
      self.nodeGroups.filter(d => d.toi === toiId).selectAll('circle').on("click", (e, d) => {
        handleMouseClickNodes(d, self, d3, true)
      })
    }
  }
  setTimeout(() => {
    self.addSvgClickListener();
  }, 100);
}

function renderGroupedNodes(self, d3) {
  self.groupedNodesbyToi = self.svg.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(self.tois.map((toi) => {
      return {
        id: toi.id,
        name: toi.name,
        toi: toi.id,
        x: 0,
        y: 0
      }
    }))
    .join("g")
    .attr("class", "grouped-node-group")
    .style("cursor", "pointer")

  self.groupedNodes = self.groupedNodesbyToi.append("circle")
    .attr('r', (d) => {
      let toinodes = self.nodeGroups.filter(n => n.toi === d.id)
      return toinodes.data().length / 3;
    })
    .style("opacity", defaultGroupedNodeOpacity)
    .style("fill", (d) => {
      return self.saturatedToiColor[self.tois.map(el => el.id).findIndex((e) => e === d.id)];
    })
    .attr("id", d => `grouped-node-${d.id}`)
    .attr("stroke", defaultNodeStroke)
    .style('display', 'none')
    .on('click', (e, d) => {
      hideGroupedNodeForToi(d.id, self, d3)
    })
    .on("mouseenter", function (e, d) {
      d3.select(this).style("stroke", clickedNodeColor).style("opacity", 1)
     
    })
    .on("mouseleave", function (e, d) {
      d3.select(this).style("opacity", defaultGroupedNodeOpacity).style("stroke", defaultNodeStroke)
    })
    .call(
      d3
        .drag()
        .on("start", (e, d) => dragGroupedStarted(e, d, self))
        .on("drag", (e, d) => draggedGrouped(e, d))
        .on("end", (e, d) => dragGroupedEnded(e, d, self, d.id))
    );
}
function dragGroupedStarted(event: any, d: any, self) {
  d.x = event.x;
  d.y = event.y
  if (!event.active) self.simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}
function draggedGrouped(event: any, d: any) {
  d.fx = event.x;
  d.fy = event.y;
  d.x = d.fx;
  d.y = d.fy;
}
function dragGroupedEnded(event: any, d: any, self, toiId) {
  toiNodesBar[toiId].xBar = event.x;
  toiNodesBar[toiId].yBar = event.y;
  d.x = event.x;
  d.y = event.y
  if (!event.active) self.simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function showGroupedNodeforTOI(self, toiId, d3) {
  self.nodeGroups.filter(d => d.toi === toiId).selectAll('circle').style('display', 'none');
  let groupedNode = self.groupedNodes.filter(d => `grouped-node-${d.id}` === `grouped-node-${toiId}`);
  let nodeData = groupedNode.data()[0];

  nodeData.x = toiNodesBar[toiId].xBar;
  nodeData.y = toiNodesBar[toiId].yBar;

  groupedNode
    .attr('cx', nodeData.x)
    .attr('cy', nodeData.y)
    .style('display', 'block');
  

  showGroupedLinks(self, toiId, groupedNode, d3);
};
function showGroupedLinks(self, toiId, groupedNode, d3) {
  let keys = Object.entries(toiNodesBar)
    .filter(([key, value]) => value.grouped)
    .map(([key]) => Number(key)) 

 
  toiNodesBar[toiId].grouped = true;
  let hiddenLinks = self.links.filter(link =>
    link.source.toi == toiId || link.target.toi == toiId
  ).style("display", "none")

  let newLinksData = hiddenLinks.data().flatMap(link => { 
    if (link.target.toi == toiId && link.source.toi == toiId) { 
      return []
    }
    if (link.source.toi === toiId && !keys.includes(link.target.toi)) {
      return [{
        ...link,
        weight: link.weight,
        source: groupedNode.data()[0], 
        target: link.target
      }];
    }
    if (link.target.toi === toiId && !keys.includes(link.source.toi))
      return [{
        ...link,
        weight: link.weight,
        source: link.source,
        target: groupedNode.data()[0] 
      }];

    return []
  });

  if (self.groupedLinks) {
    let groupedLinksMap = new Map();

    let linksToSingleNodes = []; 

    self.groupedLinks.data().forEach(link => { 
      let sourceGroup = link.source.toi === toiId ? groupedNode.data()[0] : link.source;
      let targetGroup = link.target.toi === toiId ? groupedNode.data()[0] : link.target;
      let nLinks=link.n_links;
      let groupedToiId=Object.entries(toiNodesBar)
      .filter(([key, value]) => value.grouped)
      .map(([key]) => Number(key))

      if (groupedToiId.includes(sourceGroup.toi) && groupedToiId.includes(targetGroup.toi)) {
      
        let key = [sourceGroup.id, targetGroup.id].sort((a, b) => a - b).join("-");

        if (!groupedLinksMap.has(key)) {
          groupedLinksMap.set(key, {
            ...link,
            weight: 0,
            source: sourceGroup,
            target: targetGroup,
            n_links:nLinks?nLinks:0
          });
        }
        groupedLinksMap.get(key).weight += link.weight;
        if(!nLinks)groupedLinksMap.get(key).n_links++;
      } else {
        
        linksToSingleNodes.push({
          ...link,
          source: sourceGroup,
          target: targetGroup,
        });
      }
    });

    let aggregatedGroupedLinks = Array.from(groupedLinksMap.values());

    let existingLinksData = aggregatedGroupedLinks.concat(linksToSingleNodes);

    newLinksData = existingLinksData.concat(newLinksData);
  }
  let uniqueLinksData = newLinksData

  drawGroupedLinks(d3, self, uniqueLinksData)
  self.svg.selectAll(".nodes").raise();
  self.svg.selectAll(".tooltip-source").raise();
  self.svg.selectAll(".tooltip-target").raise();
  let link = self.svg.select(".links").selectAll("line");
  if (!self.isPCALayout)
    self.simulation.force("link").links(link.data());
  self.groupedLinks.attr("transform", self.currentTransform);
}
function hideGroupedNodeForToi(toiId, self, d3) {
 
  self.groupedNodes.filter(d => `grouped-node-${d.id}` === `grouped-node-${toiId}`).style("display", "none")

  let nodes = self.nodeGroups.filter(d => d.toi === toiId).selectAll('circle').style('display', 'block');

  nodes.on("click", (e, d) => {
    showGroupedNodeforTOI(self, toiId, d3)
  })
  removeGroupedLinksForToi(self, toiId, d3)
};
function removeGroupedLinksForToi(self, toiId, d3) {
  toiNodesBar[toiId].grouped = false;

  let keys = Object.entries(toiNodesBar)
    .filter(([key, value]) => value.grouped)
    .map(([key]) => Number(key))
  let linksToRemove = self.groupedLinks.filter(link =>
    link.source.toi == toiId || link.target.toi == toiId
  )
  self.groupedLinks = self.groupedLinks.filter(link =>
    !(link.source.toi == toiId || link.target.toi == toiId)
  )
  linksToRemove.remove(); 

  let hiddenLinks = self.links.filter(link =>
    link.source.toi == toiId || link.target.toi == toiId
  ).style("display", "none") 

  let newLinksData = hiddenLinks.data().flatMap(link => {
    if (link.source.toi == toiId && keys.includes(link.target.toi)) {
      let groupedNode = self.groupedNodes.filter(d => `grouped-node-${d.id}` === `grouped-node-${link.target.toi}`);
      return [{
        ...link,
        weight: link.weight,
        source: link.source,
        target: groupedNode.data()[0]
      }]
    }
    if (link.target.toi == toiId && keys.includes(link.source.toi)) {
      let groupedNode = self.groupedNodes.filter(d => `grouped-node-${d.id}` === `grouped-node-${link.source.toi}`);
      return [{
        ...link,
        weight: link.weight,
        source: groupedNode.data()[0],
        target: link.target
      }]
    }
    d3.select(`#link-${link.source.id}-${link.target.id}`).style("display", "block");
    return []
  });

  if (self.groupedLinks) newLinksData = newLinksData.concat(self.groupedLinks.data());

  drawGroupedLinks(d3, self, newLinksData);

  self.svg.selectAll(".nodes").raise();
  self.svg.selectAll(".tooltip-source").raise();
  self.svg.selectAll(".tooltip-target").raise();
  let link = self.svg.select(".links").selectAll("line");
  if (!self.isPCALayout)
    self.simulation.force("link").links(link.data());

  self.groupedLinks.attr("transform", self.currentTransform);
}

function drawGroupedLinks(d3, self, newLinksData) {
  if (self.groupedLinks) self.groupedLinks.remove();

  self.groupedLinks = self.svg.append("g")
    .attr("class", "grouped-links")
    .selectAll("line")
    .data(newLinksData)
    .join("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .attr("stroke", defaultLinkColor)
    .attr('stroke-width', d => {
      if (d.weight <= 1) return (d.weight * 100 - self.tresholdLinks) / (100 - self.tresholdLinks) * 3
     if (d.weight > 500) {
        return 35;
      } else if (d.weight > 400) {
        return 25;
      } else if (d.weight > 300) {
        return 22.5;
      } else if (d.weight > 200) {
        return 20;
      } else if (d.weight > 100) {
        return 17.5;
      } else if (d.weight > 50) {
        return 12.5;
      }else if (d.weight > 30) {
        return 10;
      } else {
        return 3;
      }
    })
    .attr("stroke-opacity", defaulfLinkOpacity)
    .style("display", "block")
    .on("mouseenter", function (e, d) {
      d3.select(this).attr("stroke", highlightlinkColor).attr("stroke-opacity", "90%")
      let text;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const [x, y] = d3.pointer(e);
      if(d.n_links!=undefined){
        text = "N. Links: " + d.n_links
      const tooltip = d3.select(".tooltip-source").style("opacity", 1).attr("transform", `translate(${x}, ${y})`)
      const tempText = self.svg.append("text").style("font-size", "10px").text(text)
      let tooltipWidth = tempText.node().getComputedTextLength() + 10;
      tempText.remove();
      tooltip.selectAll("rect").attr("width", tooltipWidth)
      tooltip.selectAll("text").attr("x", tooltipWidth / 2);
      tooltip.select("text").text(`${text}`);
    }
    })
    .on("mouseleave", function (e, d) {
      d3.select(this).attr("stroke", defaultLinkColor).attr("stroke-opacity", defaulfLinkOpacity)
      self.svg.selectAll(".tooltip-source").style("opacity", 0)
      .attr("transform", `translate(1000, 1000)`);

    })
}

function calculateCenterForToi(toiId, nodes) {
  let xBar = 0;
  let yBar = 0;
  let count = 0;

  nodes.each(d => {
    if (d.toi === toiId) {
      xBar += d.x;
      yBar += d.y;
      count += 1;
    }
  });

  xBar /= count;
  yBar /= count;

  return { xBar, yBar };
}

function forceAttractToCenterSingle(toiId) {
  return function (alpha) {
    return function (d) {
      if (d.toi === toiId) {
        d.vx += (toiNodesBar[toiId].xBar - d.x);
        d.vy += (toiNodesBar[toiId].yBar - d.y);
      }
    };
  };
}

function updateHighlighting(self, d3) {
  //reset layout----
  self.links
    .attr("stroke", defaultLinkColor)
    .attr("stroke-opacity", defaulfLinkOpacity);

  self.nodes.style("opacity", defaultNodeOpacity)
    .attr("stroke", defaultNodeStroke);

  if (self.geoLayout || self.isPCALayout) {
    self.links.style("visibility", "hidden");
  }

  self.nodesToHighlight = d3.select(null);
  self.adjacentLinks = d3.select(null);
  self.showedLabels = [];

  const nodesToHighlight = [];
  const linksToHighlight = [];
  //end reset----
  console.log(self.clickedNode)

  if (self.clickedNodes) {
    self.clickedNodes.forEach(clickedNode => {
      if (clickedNode.adjacentNodes && clickedNode.adjacentLinks) {
        nodesToHighlight.push(
          ...clickedNode.adjacentNodes.map(n => n.id),
          clickedNode.id
        );
        linksToHighlight.push(...clickedNode.adjacentLinks);
      } else {
        nodesToHighlight.push(clickedNode.id);
      }
    });
   
    if (linksToHighlight.length > 0) {
      self.adjacentLinks = d3.selectAll(linksToHighlight);
      self.adjacentLinks
        .style("visibility", link =>
          (link.weight * 100 < self.tresholdLinks) ? 'hidden' : 'visible'
        )
        .attr("stroke", adjacentColor)
        .attr("stroke-opacity", "100%");
    }
   
    const nodesToHighlightSet = new Set(nodesToHighlight);
    const nodesToHighlightArray = [];

    self.nodeGroups.each(function () {
      const nodeGroup = d3.select(this);
      const nodeData = nodeGroup.datum();
      const nodeId = nodeData.id;
      const circle = nodeGroup.select("circle");

      if (nodesToHighlightSet.has(nodeId)) {
        circle
          .style("opacity", 1)
          .style("stroke",
            self.clickedNodes.some(n => n.id === nodeId)
              ? clickedNodeColor
              : adjacentColor
          );

        nodesToHighlightArray.push(this);
        const label = self.labels.filter(function () {
          return d3.select(this).datum().id === nodeId;
        });
        if (!label.empty()) {
          self.showedLabels.push(label);
        }
      } else {
        circle
          .style("opacity", defaultNodeOpacity)
          .style("stroke", defaultNodeStroke);
      }
    });

    self.nodesToHighlight = d3.selectAll(nodesToHighlightArray);
  }
  if (self.adjacentLinks) self.adjacentLinks.raise();
  if (!self.areLabelHidden) self.showSelectedLabels();
}

export function handleMouseClickNodes(d, self, d3, showAdjacent) {
  if (self.clickedNodes == null) {
    self.clickedNodes = [];
  }
  if (!self.areEdgesShowed) showAdjacent = false; 

  const nodeIndex = self.clickedNodes.findIndex(node => node.id === d.id);

  if (nodeIndex === -1) { 
    if (showAdjacent) {
      const adjacentNodes = self.links
        .filter((link: any) =>
          (link.source.id === d.id || link.target.id === d.id) && 
          link.weight * 100 > self.tresholdLinks &&             
          (!self.removeLinksWithSameToi || link.source.toi !== link.target.toi) 
        ).data()
        .map(link =>
          link.source.id === d.id ? link.target : link.source
        );
      const adjacentLinks = self.links.filter((link: any) =>
        (link.source.id === d.id || link.target.id === d.id) &&
        (link.weight * 100 > self.tresholdLinks) &&          
        (!self.removeLinksWithSameToi || link.source.toi !== link.target.toi)
      );

      d.adjacentNodes = adjacentNodes;
      d.adjacentLinks = adjacentLinks;
    } else {
      d.adjacentNodes = null;
      d.adjacentLinks = null;
    }

    self.clickedNodes.push(d);
    self.toiSelection[d.toi] += 1;

    if (self.clickedNodes.length === 1) {
      self.closeParallelCoordinates();
      self.showBarChart(d);
    } else {
      self.showParallelCoordinatesChart(self.clickedNodes);
    }
  } else {    
    self.clickedNodes.splice(nodeIndex, 1);
    self.toiSelection[d.toi] -= 1;
    if (self.clickedNodes.length === 0) {
      self.hideBarChart();
      self.clickedNodes = null
    } else if (self.clickedNodes.length === 1) {
      self.closeParallelCoordinates();
      self.showBarChart(self.clickedNodes[0]);
    } else {
      self.showParallelCoordinatesChart(self.clickedNodes);
    }
  }
  updateHighlighting(self, d3);
}

let adjLinkOver = null;
function highlightAdjacentOver(d, self, d3) {
  adjLinkOver = self.links.filter(
    (link: any) => (link.source.id === d.id || link.target.id === d.id) && link.weight * 100 > self.tresholdLinks
  );
  adjLinkOver
    .style("visibility", d => (d.weight * 100 < self.tresholdLinks) ? 'hidden' : 'visible')
    .attr("stroke", "red").attr("stroke-opacity", "100%")
}

function deHighlightAdjacentOver(d, self, d3) {
  adjLinkOver
    .style("visibility", d => (d.weight * 100 < self.tresholdLinks) ? 'hidden' : 'visible')
    .attr("stroke", d => {
      return self.adjacentLinks && self.adjacentLinks.data().includes(d)
        ? adjacentColor
        : defaultLinkColor;
    })
    .attr("stroke-opacity", d => {
      return self.adjacentLinks && self.adjacentLinks.data().includes(d)
        ? "100%"
        : defaulfLinkOpacity;
    });

  if (self.geoLayout || self.isPCALayout) {
    self.links.style("visibility", "hidden");
  }
  if (self.adjacentLinks)
    self.adjacentLinks
      .style("visibility", d => (d.weight * 100 < self.tresholdLinks) ? 'hidden' : 'visible')
      .attr("stroke", adjacentColor).attr("stroke-opacity", "100%")
  adjLinkOver = null;
}
