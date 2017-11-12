console.log("WTF");
d3.json("data/embedding.json", function(err, data) {
  console.log(data);
  
  var keys = data.keys;
  var points = [];
  for (var i = 0; i < data["100"].size; i++) {
    var p = {};
    for (var j = 0; j < keys.size; j++) {
      p[keys[j]] = data[keys[j]][i];
    }
    points.push(p);
  };
  
  var w = 500, h = 500;
  
  var svg = d3.select("body")
              .append("svg")
              .attr("width", w)
              .attr("height", h);
              
  svg.selectAll("circle")
     .data(points)
     .enter()
     .append("circle");
     
  
});