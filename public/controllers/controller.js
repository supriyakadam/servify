var app = angular.module('myApp', ['ngStorage', 'ui.router'])
app
  .config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
      $stateProvider
        .state('home', {
          url: '/',
          templateUrl: '../index.html',
          controller: 'MapCtrl'
        })
        .state('checkServiceAreas', {
          url: '/checkServiceAreas',
          templateUrl: '../checkServiceAreas.html',
          controller: 'checkServiceAreasCtrl'
        })

      $urlRouterProvider.otherwise('home');
    }
  ]);
var url = "http://localhost:3000";
app.controller('MapCtrl', function ($scope, $http, $localStorage) {
  var drawingManager;
  var selectedShape;
  var infoWindow = {};
  var map = {};
  var newShape = {};
  $scope.form = {};
  $scope.allServiceAreas = [];
  $scope.coordinates = [];
  var currentPolygon = [];
  $scope.$storage = $localStorage;
  // if ($localStorage.project === undefined) {
  //   $localStorage.project = [];
  // }
  if ($localStorage.polyBounds === undefined) {
    $localStorage.polyBounds = [];
  }

  function clearSelection() {
    infoWindow.close(map)
    if (selectedShape) {
      selectedShape.setEditable(false);
      selectedShape = null;
    }
  }
  // $localStorage.project = [];
  // $localStorage.polyBounds=[];
  function showInfo(event) {
    var vertices = this.getPath();
    var contentString = 'Clicked location: <br>' + "" + event.latLng.lat() + ',' + event.latLng.lng() +
      '<br>';
    if (this.content) {
      contentString += '<br>' + this.content + '<br>'
    }
    // Iterate over the vertices.
    for (var i = 0; i < vertices.getLength(); i++) {
      var xy = vertices.getAt(i);

      contentString += '<br>' + 'Coordinate ' + i + ':<br>' + xy.lat() + ',' +
        xy.lng();
    }
    // Replace the info window's content and position.
    infoWindow.setContent(contentString);
    infoWindow.setPosition(event.latLng);
    infoWindow.open(map);
  }

  function setSelection(shape) {
    //clearSelection();
    console.log(shape);
    if (shape.editable) {
      selectedShape = shape;
      selectedShape.setEditable(true);
    }
  }

  function deleteSelectedShape() {
    if (selectedShape) {
      selectedShape.setMap(null);
      drawingManager.setOptions({
        drawingControl: true
      });

    }
  }
  $scope.clearData = function () {
    deleteSelectedShape();
    $scope.coordinates = [];
  }
  $scope.saveServiceArea = function (data) {
    infoWindow.close(map);
    $http.post(url + '/serviceArea/saveServiceArea', {
      name: data.serviceName,
      coordinates: $scope.coordinates
    }).success(function (response) {
      clearSelection();
      newShape = null;
      $scope.form = {};
      drawingManager.setOptions({
        drawingControl: true
      });
      $scope.coordinates = [];
      if (response && !response.err) {
        // $scope.$storage.project.push(response.data);
        var newCoordinates = response.data.loc.coordinates[0];
        var polyBoundsArr = newCoordinates.map((n, i) => {
          return {
            lat: n[1],
            lng: n[0]
          }
        });
        $scope.$storage.polyBounds.push({
          name: response.data.name,
          coordinates: polyBoundsArr
        });
        console.log("-----------------", $scope.$storage.polyBounds)
        var options = {
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          editable: false,
          content: response.data.name
        }
        currentPolygon.setOptions(options);
        currentPolygon.addListener('click', showInfo);
      }
    });
  }
  $scope.displayAllServiceAreas = function () {
    $http.get(url + '/serviceArea/getServiceAreas').success(function (response) {
      displayPolygons(response.data);
    });
  }

  function displayPolygons(data) {
    $scope.form = {};
    currentPolygon = [];
    $scope.coordinates = [];
    for (i = 0; i < data.length; i++) {
      var polygonCoords = [];
      var coordinates = data[i].loc.coordinates[0];
      var polygonCoords = coordinates.map((n) => {
        return {
          lat: n[1],
          lng: n[0]
        }
      });
      // Construct the polygon.
      var polygon = new google.maps.Polygon({
        paths: polygonCoords,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        editable: false,
        content: data[i].name
      });
      //console.log("name",data[i]);
      polygon.setMap(map);
      polygon.addListener('click', showInfo);
    }
    drawingManager.setOptions({
      drawingControl: true
    });
  }

  function initialize() {
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 10,
      center: new google.maps.LatLng(19.0760, 72.8777),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      zoomControl: true
    });
    infoWindow = new google.maps.InfoWindow;
    var polyOptions = {
      strokeWeight: 0,
      fillOpacity: 0.45,
      editable: true
    };
    drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControlOptions: {
        drawingModes: [
          google.maps.drawing.OverlayType.POLYGON
        ]
      },
      polylineOptions: {
        editable: true
      },
      polygonOptions: polyOptions,
      map: map
    });
    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (e) {
      // Switch back to non-drawing mode after drawing a shape.
      drawingManager.setDrawingMode(null);
      // To hide:
      drawingManager.setOptions({
        drawingControl: false
      });
      // Add an event listener that selects the newly-drawn shape when the user
      // mouses down on it.
      newShape = e.overlay;
      newShape.type = e.type;
      google.maps.event.addListener(newShape, 'click', function () {
        if (newShape) {
          newShape.editable = true;
          setSelection(newShape);
        }
      });
      setSelection(newShape);
      google.maps.event.addListener(map, 'click', clearSelection);
    });
    google.maps.event.addDomListener(drawingManager, 'polygoncomplete', function (polygon) {
      currentPolygon = polygon;
      google.maps.event.addListener(polygon.getPath(), 'set_at', processVertex);
      google.maps.event.addListener(polygon.getPath(), 'insert_at', processVertex);
      google.maps.event.addListener(polygon.getPath(), 'remove_at', processVertex);
      polygon.addListener('click', showInfo);

      function processVertex(e) {
        $scope.coordinates = [];
        for (var i = 0; i < this.getLength(); i++) {
          $scope.coordinates.push({
            lng: this.getAt(i).lng(),
            lat: this.getAt(i).lat()
          });
        }
        $scope.$apply();
      }

      var polygonBounds = polygon.getPath();
      for (var i = 0; i < polygonBounds.length; i++) {
        $scope.coordinates.push({
          lng: polygonBounds.getAt(i).lng(),
          lat: polygonBounds.getAt(i).lat()
        });
      }
      $scope.$apply();
    })
    $scope.displayAllServiceAreas()
  }
  initialize();
});
app.controller('checkServiceAreasCtrl', function ($scope, $http, $localStorage) {
  function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 10,
      center: new google.maps.LatLng(19.0760, 72.8777),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      zoomControl: true
    });
    var infoWindow = new google.maps.InfoWindow;

    function showInfo(event, data) {
      var contentString = 'Clicked location: <br>' + "" + event.latLng.lat() + ',' + event.latLng.lng() +
        '<br>';
      contentString += '<br>' + data.name + '<br>'
      // Iterate over the vertices.
      for (var i = 0; i < data.coordinates.length; i++) {
        contentString += '<br>' + 'Coordinate ' + i + ':<br>' + data.coordinates[i].lat + ',' +
          data.coordinates[i].lng;
      }
      console.log(contentString);
      // Replace the info window's content and position.
      infoWindow.setContent(contentString);
      infoWindow.setPosition(event.latLng);
      infoWindow.open(map);
    }
    google.maps.event.addListener(map, 'click', function (e) {
      infoWindow.close(map);
      var containsLatLong = null;
      //uncomment from line 281-320 to check service area from backend
      // $http.post(url + '/serviceArea/checkServiceArea', {
      //   clickedArea: [e.latLng.lng(), e.latLng.lat()]
      // }).success(function (response) {
      //   if (response.data) {
      //     var coordinates = response.data.loc.coordinates[0].map((n) => {
      //       return {
      //         lat: n[1],
      //         lng: n[0]
      //       }
      //     })
      //     containsLatLong = {
      //       name: response.data.name,
      //       coordinates: coordinates
      //     }
      //   }
      //   var resultPath =
      //       containsLatLong ?
      //       "m 0 -1 l 1 2 -2 0 z" :
      //       google.maps.SymbolPath.CIRCLE;
            
      //     var resultColor =
      //       containsLatLong ?
      //       'blue' :
      //       'red';
      //     new google.maps.Marker({
      //       position: e.latLng,
      //       map: map,
      //       icon: {
      //         path: resultPath,
      //         fillColor: resultColor,
      //         fillOpacity: .5,
      //         strokeColor: 'white',
      //         strokeWeight: .5,
      //         scale: 10
      //       }
      //     });
      //     if (containsLatLong) {
      //       showInfo(e, containsLatLong);
      //     }
      // })

      //uncomment from line 323-354 to check service area from localstorage
      var totalRecords = $localStorage.polyBounds;
      containsLatLong = totalRecords.find((n) => {
        var polyGon = new google.maps.Polygon({
          paths: n.coordinates
        });
        return google.maps.geometry.poly.containsLocation(e.latLng, polyGon);
      })

      var resultPath =
        containsLatLong ?
        "m 0 -1 l 1 2 -2 0 z" :
        google.maps.SymbolPath.CIRCLE;

      var resultColor =
        containsLatLong ?
        'blue' :
        'red';
      new google.maps.Marker({
        position: e.latLng,
        map: map,
        icon: {
          path: resultPath,
          fillColor: resultColor,
          fillOpacity: .5,
          strokeColor: 'white',
          strokeWeight: .5,
          scale: 10
        }
      });
      if (containsLatLong) {
        showInfo(e, containsLatLong);
      }
    });
  }
  initMap();
});