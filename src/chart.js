import 'node_modules/d3-force/dist/d3-force.js';
import * as d3 from 'd3/dist/d3.js';

function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}

/**
  node = {
    x: 0,
    y: 0,
    color
  }
 */

function createGraph(nodes = []) {
  const links = [];

  return {
    nodes: nodes.reduce((a, c, i) => {
      // it would be cool if the x and y were multiplied by a normalized vector from the center of the photo
      //  but for now we'll just add a diagonal
      const colorNode = {
        index: i,
        x: c.x + 50,
        y: c.y + 50,
        vy: Math.random() * -0.00000001,
        vx: Math.random() * 0.00000001,
        color: c.color
      };

      const positionNode = {
        index: i,
        x: c.x,
        y: c.y,
        vy: 0,
        vx: 0,
        color: undefined
      }

      a.push(colorNode);
      a.push(positionNode);

      links.push({
        source: positionNode,
        target: colorNode,
        index: i
      });

      return a;
    }, []),
    links
  };
}

function generateChart(width, height, graph) {
  const svg = d3.create("svg")
                .attr('width', width*2)
                .attr('height', height*2),
                // .attr("viewBox", [0, 0, width, height])
                // .attr('preserveAspectRatio', 'xMidYMid meet'),
        link = svg
          .selectAll(".link")
          .data(graph.links)
          .join("line")
          .classed("link", true),
        node = svg
          .selectAll(".node")
          .data(graph.nodes)
          .join("circle")
          .attr("r", n => n.color ? 12 : 2)
          .style("fill", n => n.color ? n.color : "#333")
          .classed("node", true);

  const simulation = d3
    .forceSimulation()
    .nodes(graph.nodes)
    //.force("charge", d3.forceManyBody())
    //.force("center", d3.forceCenter(width / 2, height / 2))
    //.force("link", d3.forceLink(graph.links))
    .on("tick", tick);

  const drag = d3
    .drag()
    .on("start", dragstart)
    .on("drag", dragged);

  node.call(drag).on("click", click);

  function tick() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }

  function click(event, d) {
    delete d.fx;
    delete d.fy;
    d3.select(this).classed("fixed", false);
    simulation.alpha(1).restart();
  }

  function dragstart() {
    d3.select(this).classed("fixed", true);
  }

  function dragged(event, d) {
    d.fx = clamp(event.x, 0, width);
    d.fy = clamp(event.y, 0, height);
    simulation.alpha(1).restart();
  }
  return {
    svg: svg.node(),
    simulation
  }
}

export {
  generateChart,
  createGraph
}
