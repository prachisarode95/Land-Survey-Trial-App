
// All Global Variables
var draw
var flagIsDrawingOn = false
var PointType = ['ATM','Tree','Telephone Poles', 'Electricity Poles'];
var LineType = ['National Highway','State Highway','River','Telephone Lines'];
var PolygonType = ['Water Body','Commercial Land', 'Residential Land','Building', 'Agricultural lands'];
var selectedGeomType


// // Custom popup
var popup = new ol.Overlay.Popup ({
    popupClass: "default anim", 
    closeBox: true,
    onclose: function(){ console.log("You close the box"); },
    positioning: 'auto',
    autoPan: true,
    autoPanAnimation: { duration: 100 }
  });

// Custom Control
 /**
       * Define a namespace for the application.
       */
      window.app = {};
      var app = window.app;
      /**
       * @constructor
       * @extends {ol.control.Control}
       * @param {Object=} opt_options Control options.
       */
      app.DrawingApp = function(opt_options) {

        var options = opt_options || {};

        var button = document.createElement('button');
        button.id = 'drawbtn'
        button.innerHTML = '<i class="fas fa-pencil-ruler"></i>';

        var this_ = this;
        var startStopApp = function() {
            if (flagIsDrawingOn == false){
       $('#startdrawModal').modal('show')
            } else {
                map.removeInteraction(draw)
                flagIsDrawingOn = false
                document.getElementById('drawbtn').innerHTML = '<i class="far fa-pencil-ruler"></i>'
                defineTypeofFeature()
                $("#enterInformationModal").modal('show')
            }
       
        };

        button.addEventListener('click', startStopApp, false);
        button.addEventListener('touchstart', startStopApp, false);

        var element = document.createElement('div');
        element.className = 'draw-app ol-unselectable ol-control';
        element.appendChild(button);

        ol.control.Control.call(this, {
          element: element,
          target: options.target
        });

      };
      ol.inherits(app.DrawingApp, ol.control.Control);

// Map View
var myview = new ol.View({
    center : [8320914.745381923, 2165846.239456522],
    zoom:14
})

// OSM Layer
var baseLayer = new ol.layer.Tile({
    source : new ol.source.OSM({
        attributions:'Land Survey Application'
    })
})

// Geoserver Layer
var featureLayersourse = new ol.source.TileWMS({
    url:'http://localhost:8080/geoserver/land_surveyapp/wms',
    params:{'LAYERS':'land_surveyapp:DrawnFeatures', 'tiled' : true},
    serverType:'geoserver'
})
var featureLayer = new ol.layer.Tile({
    source:featureLayersourse
})
// Draw vector layer
// 1 . Define source
var drawSource = new ol.source.Vector()
// 2. Define layer
var drawLayer = new ol.layer.Vector({
    source : drawSource
})
// Layer Array
var layerArray = [baseLayer,featureLayer,drawLayer]
// Map
var map = new ol.Map({
    controls: ol.control.defaults({
        attributionOptions: {
          collapsible: false
        }
      }).extend([
        new app.DrawingApp()
      ]),
    target : 'mymap',
    view: myview,
    layers:layerArray,
    overlays: [popup]
})

// Function to start Drawing
function startDraw(geomType){
    selectedGeomType = geomType
    draw = new ol.interaction.Draw({
        type:geomType,
        source:drawSource
    })
    $('#startdrawModal').modal('hide')
   
    map.addInteraction(draw)
    flagIsDrawingOn = true
    document.getElementById('drawbtn').innerHTML = '<i class="far fa-stop-circle"></i>'
}

// Function to add types based on feature
function defineTypeofFeature(){
    var dropdownoftype = document.getElementById('typeofFeatures')
    dropdownoftype.innerHTML = ''
    if (selectedGeomType == 'Point'){
        for (i=0;i<PointType.length;i++){
            var op = document.createElement('option')
            op.value = PointType[i]
            op.innerHTML = PointType[i]
            dropdownoftype.appendChild(op)
        }
    } else if (selectedGeomType == 'LineString'){
        for (i=0;i<LineType.length;i++){
            var op = document.createElement('option')
            op.value = LineType[i]
            op.innerHTML = LineType[i]
            dropdownoftype.appendChild(op)
        }
    }else{
        for (i=0;i<PolygonType.length;i++){
            var op = document.createElement('option')
            op.value = PolygonType[i]
            op.innerHTML = PolygonType[i]
            dropdownoftype.appendChild(op)
        }
    }
}


// Function to save feature information in postgresql database
function savetodb(){
    // get array of all features 
    var featureArray = drawSource.getFeatures()
    // Define geojson format 
    var geogJONSformat = new ol.format.GeoJSON()
    // Use method to convert feature to geojson
    var featuresGeojson = geogJONSformat.writeFeaturesObject(featureArray)
    // Array of all geojson
    var geojsonFeatureArray = featuresGeojson.features

    for (i=0;i<geojsonFeatureArray.length;i++){
        var type = document.getElementById('typeofFeatures').value
        var name = document.getElementById('exampleInputtext1').value
        var geom = JSON.stringify(geojsonFeatureArray[i].geometry)
        if (type != ''){
            $.ajax({
                url:'save.php',
                type:'POST',
                data :{
                    typeofgeom : type,
                    nameofgeom : name,
                    stringofgeom : geom
                },
                success : function(dataResult){
                    var result = JSON.parse(dataResult)
                    if (result.statusCode == 200){
                        console.log('data added successfully')
                    } else {
                        console.log('data not added successfully')
                    }

                }
            })
        } else {
            alert('please select type')
        }
    }

// Update layer
var params = featureLayer.getSource().getParams();
params.t = new Date().getMilliseconds();
featureLayer.getSource().updateParams(params);

// Close the Modal
$("#enterInformationModal").modal('hide')
//remove feature after drawing and saving into database successfully
clearDrawSource ()
}
function clearDrawSource (){
    drawSource.clear()
};

// Add Geolocation to the map 
  // set up geolocation to track our position
  var geolocation = new ol.Geolocation({
    tracking: true,
    projection : map.getView().getProjection(),
    enableHighAccuracy: true,
  });

// bind it to the view's projection and update the view as we move
//   geolocation.bindTo('projection', myview);
  geolocation.on('change:position', function() {
    myview.setCenter(geolocation.getPosition());
    addmarker(geolocation.getPosition())
  });

//add a marker to display the current location
  var marker = new ol.Overlay({
    element: document.getElementById('currentLocation'),
    positioning: 'center-center',
// position:  geolocation
  });
  map.addOverlay(marker);

// and bind it to the geolocation's position updates
  function addmarker(array){
  marker.setPosition(array);
//   myview.setZoom(16)
};

  // create a new device orientation object set to track the device (optional)
  var deviceOrientation = new ol.DeviceOrientation({
    tracking: true
  });
  // when the device changes heading, rotate the view so that
  // 'up' on the device points the direction we are facing
  deviceOrientation.on('change:heading', onChangeHeading);
  function onChangeHeading(event) {
    var heading = event.target.getHeading();
    view.setRotation(-heading);
  };


// Get information about feature
map.on('click', function(evt){
    popup.hide(); 
    var resolution  = map.getView().getResolution();
    var coord = evt.coordinate
    var projection = map.getView().getProjection()
    var url = featureLayersourse.getGetFeatureInfoUrl(coord,resolution,projection,{'INFO_FORMAT':'application/json'})
    console.log(url)
    if (url){
        $.getJSON(url,function(data){
            console.log(data)
            content = '<b>TYPE</b> : '+data.features[0].properties.type +' <br> <b>NAME </b> : '+data.features[0].properties.name
            if (data.features[0].geometry.type == 'Polygon'){
                popup.show(data.features[0].geometry.coordinates[0][0], content);  
            } else if (data.features[0].geometry.type == 'Point'){
                popup.show(data.features[0].geometry.coordinates, content);
            } else {
                popup.show( data.features[0].geometry.coordinates[0], content);
            }
            
        })
    }
});