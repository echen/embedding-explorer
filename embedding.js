
var NUM_DIMENSIONS = 50;
var DIMENSIONS = [];
for (var i = 0; i < 50; i++) {
  DIMENSIONS.push(i);
}

function updateBarchart(point, where = "#barchart", ider = "") {
  // HACK
  d3.select(where).style("opacity", 1);
  
  var margin = { top: 0, right: 5, bottom: 0, left: 5 };  
  var width = 230 - margin.left - margin.right;
  
  var x = d3.scaleLinear().domain([-2.5, 2.5]).range([0, width]);
  var colorScale = d3.scaleLinear().range([0, 1]).domain([-3, 3]);
  
  var data = [];
  for (var i = 0; i < NUM_DIMENSIONS; i++) {
    data.push({
      i: i,
      name: "dim" + i,
      value: point["dim" + i]      
    });
    
    var v = point["dim" + i];
    d3.select("#" + ider + "bar" + i)
      .transition().delay(0).duration(200)
      .attr("fill", function(d) { return d3.interpolateRdBu(colorScale(v)); })
      .attr('x', function (d) {return margin.left + x(Math.min(0, v));})
      .attr('width', function (d) {return Math.abs(x(v) - x(0));})
      .attr('height', 9);
  };    
}

function createBarchart(point, where = "#barchart", ider = "") {
  var data = [];
  for (var i = NUM_DIMENSIONS - 1; i >= 0; i--) {
    data.push({
      i: i,
      name: "dim" + i,
      value: point["dim" + i]
    });
  }

  var margin = { top: 0, right: 5, bottom: 0, left: 5 };
  var height = 500 - margin.top - margin.bottom;
  var width = 230 - margin.left - margin.right;

  var svg = 
    d3.select(where)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var x = d3.scaleLinear().domain([-2.5, 2.5]).range([0, width]);
  var y = d3.scaleBand().domain(data.map(function (d) {return d.name;})).rangeRound([height, 0]);

  svg
    .selectAll('.bar')
    .data(data)
    .enter().append('rect')
      .attr("id", function(d) { return ider + "bar" + d.i; })
      .attr('x', function (d) {return x(Math.min(0, d.value));})
      .attr('y', function (d) {return y(d.name);})
      .attr('width', function (d) {return Math.abs(x(d.value) - x(0));})
      .attr('height', 9);
};

function getPoints(data) {
  var keys = data["columns"];
  
  var points = [];
  for (var i = 0; i < data["data"].length; i++) {
    var p = {};
    
    for (var j = 0; j < keys.length; j++) {
      p[keys[j]] = data["data"][i][j];
    }
    
    points.push(p);
  };  
  
  return points;
}

function circleBorderOpacity(point, cluster) {
  if (cluster != -1) {
    if (point.cluster == cluster) {
      return 1.0;
    } else {
      return 0.2;
    }
  } else {
    return 0.2;
  }
}

function circleOpacity(point, cluster) {
  if (cluster != -1) {
    if (point.cluster == cluster) {
      return 0.95;
    } else {
      return 0.05;
    }
  } else {
    return 0.8;
  }
}

function circleRadius(point, cluster) {
  if (cluster != -1) {
    if (point.cluster == cluster) {
      return 5;
    } else {
      return 3;
    }
  } else {
    return 3;
  }        
}

function embeddingDist(x, y) {
  var dist = 0;
  for (var i = 0; i < NUM_DIMENSIONS; i++) {
    dist += Math.pow(x["dim" + i] - y["dim" + i], 2)
  }
  return dist;
}
function nearestNeighbors(points, word, n) {
  var ps = _.sortBy(points, function(p) { return embeddingDist(p, word); });
  return ps.slice(1, n + 1);
}

d3.json("data/embedding50.json", function(err, data) {
  var WIDTH = 500,
      HEIGHT = 500;
    
  var points = getPoints(data);

  // HACK  
  createBarchart(points[0]);
  d3.select("#barchart").style("opacity", 0);  
  
  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var xValue = function(d) { return d["t0"]; }, // data -> value
      xScale = d3.scaleLinear().range([0, WIDTH]), // value -> display
      xMap = function(d) { return xScale(xValue(d));}; // data -> display

  var yValue = function(d) { return d["t1"]; }, // data -> value
      yScale = d3.scaleLinear().range([HEIGHT, 0]), // value -> display
      yMap = function(d) { return yScale(yValue(d));}; // data -> display      

  xScale.domain([d3.min(points, xValue) - 1, d3.max(points, xValue) + 1]);
  yScale.domain([d3.min(points, yValue) - 1, d3.max(points, yValue) + 1]);
    
  var embeddingSvg = 
    d3.select("#main_scatterplot")
      .append("svg")
      .attr("width", WIDTH)
      .attr("height", HEIGHT);
                     
  var clusterEmbeddingSvg = 
    d3.select("#cluster_scatterplot")
      .append("svg")
      .attr("width", WIDTH)
      .attr("height", HEIGHT);      

  var tooltip = d3.select("body").append("div")	
      .attr("class", "tooltip")
      .style("opacity", 0);

  function createClickedWord(d) {
    var cw = d3.select("#clicked_word");
    cw.html("");

    cw.append("h1")
      .text(d.word);

    function coloredSpans(ps) {
      var ret = _.map(ps,
          function(p) {
            return "<span style='color:" + color(p.cluster) + "'>" + p.word + "</span>";
          }
        );

      return ret.join(", ");
    }  

    var nnBox = cw.append("div").classed("box", true);
    var nns = nearestNeighbors(points, d, 25);
    nnBox.append("h3")
      .text("Nearest Neigbors");
    nnBox.append("p")
      .html(coloredSpans(nns));

    var clusterBox = cw.append("div").classed("box", true);
    var clusterPoints = _.filter(points, function(x) { return x["cluster"] == d.cluster; });
    var samples = _.sample(clusterPoints, 25);
    clusterBox
      .datum(d.cluster)
      .append("h3")
      .text("Belongs to Cluster " + (d.cluster + 1))
      .classed("linklike text-primary", true)
      .on("click", function(i) {
        var clusterPoints = _.filter(points, function(x) { return x["cluster"] == i; });
        draw(embeddingSvg, points, i);        
        draw(clusterEmbeddingSvg, clusterPoints, i);
      });
    clusterBox.append("p")
      .html(coloredSpans(samples));

    var topDimsBox = cw.append("div").classed("box", true).classed("container-fluid", true);
    topDimsBox.append("h3").text("Top Dimensions");
    var topDimsBoxRow = topDimsBox.append("div").classed("row", true);
    var cbc = topDimsBoxRow.append("div").attr("id", "clickedBarchart").classed("col-sm-2", true);
    var tdr = topDimsBoxRow.append("div").attr("id", "clickedTopDims").classed("col-sm-10", true);

    var topDims = _.sortBy(DIMENSIONS, function(i) { return -1 * Math.abs(d["dim" + i]); }).slice(0, 5);
    for (var j = 0; j < 5; j++) {
      var i = topDims[j];
      var ps = _.sortBy(points, function(x) { return x["dim" + i]; });
      var topPs = _.last(ps, 25).reverse();
      var bottomPs = _.first(ps, 25);

      var thePs = [];
      if (d["dim" + i] > 0) {
        thePs = topPs;
      } else {
        thePs = bottomPs;
      }
      var dBox = tdr.append("div").classed("box", true);
      dBox.append("h4")
        .text("Dimension " + (+i+1));
      dBox.append("p").html(coloredSpans(thePs));
    }       


    createBarchart(d, "#clickedBarchart", "clicked");
    updateBarchart(d, "#clickedBarchart", "clicked");
  }
  createClickedWord(_.sample(points));
  var recentWords = [];
  function draw(selector, data, cluster = -1) {
    selector.html("");
    
    selector.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", xMap)
      .attr("cy", yMap)
      .style("stroke", "black")
      .style("stroke-opacity", function(d) { return circleBorderOpacity(d, cluster); })
      .attr("r", function(d) { return circleRadius(d, cluster); })
      .attr('fill-opacity', function(d) { return circleOpacity(d, cluster); })
      .style("fill", function(d) { return color(d.cluster); })
      .on("click", function(d) {
        createClickedWord(d);
      })
      .on("mouseenter", function(d) {
        updateBarchart(d);
        
        var r = circleRadius(d, cluster);
        d3.select(this)
          .transition().delay(0).duration(75)
            .attr("r", 20)
            .attr("fill-opacity", 1)
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 1)
          .transition().duration(75)
            .attr("r", 10);
        
        if (recentWords.length >= 20) {
          recentWords.pop();
        }
        recentWords.unshift(d);        
        d3
          .select("#words").html("")
          .selectAll("li")
          .data(recentWords)
          .enter()
          .append("li")
          .text(function(p) { return p.word; })
          .style("color", function(p) { return color(p.cluster); });

        tooltip
          .transition()
          .duration(200)
          .style("opacity", 1);

        tooltip
          .text(d.word)
          .style("left", (d3.event.pageX) + "px")		
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {        
        tooltip.html("");
        
        var r = circleRadius(d, cluster);        
        d3.select(this)
          .transition().duration(750)
            .attr("r", r)
            .attr("stroke-width", 1)
            .style("stroke-opacity", circleBorderOpacity(d, cluster));
      });
  }
  draw(embeddingSvg, points, -1);
     
  function createClusterLists() {
    var num_clusters = _.unique(_.map(points, function(x) { return x["cluster"]; }));
    for (var i = 0; i < num_clusters.length; i++) {
      var clusterPoints = _.filter(points, function(x) { return x["cluster"] == i; });
      var samples = _.sample(clusterPoints, 50);

      var cluster = 
        d3.select("#clusters_row")
          .append("div")
          .attr("class", "col-md-3 clusterbox");

      cluster
        .datum([i, clusterPoints])
        .append("h5")
          .html("Cluster " + (i + 1))
          .classed("linklike", true)
          .style("color", function(d) { return color(d[0]); })
          .on("click", function(d) {
            var i = d[0];
            var clusterPoints = d[1];
            draw(embeddingSvg, points, i);
            draw(clusterEmbeddingSvg, clusterPoints, i);
          });

      cluster
        .append("ul")
        .classed("scrollbox", true)    
        .selectAll("li")
        .data(samples)
        .enter()
        .append("li")
        .html(function(x) { return x["word"]; });
    }    
  }
  createClusterLists();
  
  // DIMENSION SLIDERS
  d3
    .select("#dimension_select")
    .selectAll("option")
    .data(DIMENSIONS)
    .enter()
    .append("option").attr("value", function(i) { return i+1; }).text(function(i) { return "Slide Dimension " + (i+1); });
  d3.select("#dimension_select")
    .on("change", function() {
      sd = +d3.select(this).property("value") - 1;
      createSlider(sd, true);
    });  
  createSlider(0);
  
  function createEmbeddingLists() {
    for (var i = 0; i < NUM_DIMENSIONS; i++) {
      var ps = _.sortBy(points, function(x) { return x["dim" + i]; });
      var topPs = _.last(ps, 10).reverse();
      var bottomPs = _.first(ps, 10);

      var embeddings = 
        d3.select("#embeddings_row")
          .append("div")
          .attr("class", "col-md-4 embedding")
          
      embeddings
        .append("h4")
        .text("Dimension " + (i + 1));

      var row = 
        embeddings.append("div").classed("row", true);
        
      function createEmbeddingCol(text, colPoints) {
        var embeddingCol = 
          row
            .append("div")
            .attr("class", "col");

        embeddingCol
          .append("h6").text(text);

        embeddingCol
          .selectAll("li")
          .data(colPoints)
          .enter()
          .append("li")
          .text(function(p) { return p.word; })
          .style("color", function(p) { return color(p.cluster); });
      }

      createEmbeddingCol("Low", bottomPs);
      createEmbeddingCol("High", topPs);
    }
  }
  createEmbeddingLists();
  
  var oldX = -1;
  function createSlider(sDim, hueify = false) {
    var sliderDim = "dim" + sDim;
    var dim0 = _.map(points, function(p) { return p[sliderDim]; });  
    var dim0_min = _.min(dim0);
    var dim0_max = _.max(dim0);

    var sliderSvg = d3.select("#slider").html(""),
        margin = {right: 5, left: 10},
        width = +sliderSvg.attr("width") - margin.left - margin.right,
        height = 30;

    var x = d3.scaleLinear()
        .domain([dim0_min, dim0_max])
        .range([0, width])
        .clamp(true);

    var slider = sliderSvg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + height / 2 + ")");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { slider.interrupt(); })
            .on("start drag", function() { oldX = d3.event.x; hue(x.invert(d3.event.x)); }));

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);        
        
    function closeness(x, y) {
      return Math.pow(sigmoid(1.0 / (Math.pow(x - y, 2) + 0.01)), 5);
    }
    
    if (hueify && oldX != -1) {
      hue(x.invert(oldX));
    }
        
    function hue(h) {
      handle.attr("cx", x(h));

      embeddingSvg
        .selectAll("circle")
        .data(points)
        .attr("r", function(p) { return closeness(h, p[sliderDim]) * 10; })
        .attr("fill-opacity", function(p) { return closeness(h, p[sliderDim]) * 0.6; });

      clusterEmbeddingSvg
        .selectAll("circle")
        .data(points)
        .attr("r", function(p) { return closeness(h, p[sliderDim]) * 10; })
        .attr("fill-opacity", function(p) { return closeness(h, p[sliderDim]) * 0.6; });
    }        
  }

  function sigmoid(t) {
    return 1/(1+Math.pow(Math.E, -t));
  }
});