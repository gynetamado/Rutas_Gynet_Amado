require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/Expand",
  "esri/layers/FeatureLayer",
  "esri/widgets/Directions",
  "esri/widgets/Track",
  "esri/Graphic",
  "esri/rest/route",
  "esri/rest/support/RouteParameters",
  "esri/rest/support/FeatureSet",
  "dojo/domReady!",

], function(esriConfig, Map, MapView, Expand, FeatureLayer, Directions, Track, Graphic, route, RouteParameters, FeatureSet) {

esriConfig.apiKey = "AAPKe5cbac65965142caacc4f99e879243a96wQMcjhjr_Mm6589Qkt56_B-AOFWPshBSJKcBcVTLMojNCQSboxBogAduxYsvrDY";

const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

const map = new Map({
  basemap: "arcgis-topographic"
});

const view = new MapView({
  container: "viewDiv",
  map: map,
  center: [-74.08175, 4.60971],
   zoom: 13   
});

view.watch("heightBreakpoint, widthBreakpoint", function() {
var ui = view.ui;


if (view.heightBreakpoint === "xsmall" || view.widthBreakpoint === "xsmall") {
  ui.components = ["attribution"];
} else {
  ui.components = ["attribution", "zoom", "directionWidget", "directions"];
}
});

var track = new Track({
  view: view
});
view.ui.add(track, "top-left");

view.when(function() {
  track.start();
});

var directionsWidget = new Directions({
view: view,

routeServiceUrl: routeUrl ,
container: document.createElement("div")
});

var directionsExpand = new Expand({
view: view,
content: directionsWidget
});

view.ui.add(directionsExpand, {
    position: "top-right",
  });

view.on("click", function(event){

  if (view.graphics.length === 0) {
    addGraphic("origin", event.mapPoint);
  } else if (view.graphics.length === 1) {
    addGraphic("destination", event.mapPoint);

    getRoute();

  } else {
    view.graphics.removeAll();
    addGraphic("origin",event.mapPoint);
  }

});

function addGraphic(type, point) {
  const graphic = new Graphic({
    symbol: {
      type: "simple-marker",
      color: (type === "origin") ? "white" : "black",
      size: "8px"
    },
    geometry: point
  });
  view.graphics.add(graphic);
}

function getRoute() {
  const routeParams = new RouteParameters({
    stops: new FeatureSet({
      features: view.graphics.toArray()
    }),

    returnDirections: true

  });

  route.solve(routeUrl, routeParams)
    .then(function(data) {
      data.routeResults.forEach(function(result) {
        result.route.symbol = {
          type: "simple-line",
          color: [5, 150, 255],
          width: 3
        };
        view.graphics.add(result.route);
      });

     if (data.routeResults.length > 0) {
       const directions = document.createElement("ol");
       directions.classList = "esri-widget esri-widget--panel esri-directions__scroller";
       directions.style.marginTop = "0";
       directions.style.padding = "15px 15px 15px 30px";
       const features = data.routeResults[0].directions.features;

       features.forEach(function(result,i){
         const direction = document.createElement("li");
         direction.innerHTML = result.attributes.text + " (" + result.attributes.length.toFixed(2) + " miles)";
         directions.appendChild(direction);
       });

      view.ui.empty("top-right");
      view.ui.add(directions, "top-right");

     }

    })

    .catch(function(error){
        console.log(error);
    })

}

});