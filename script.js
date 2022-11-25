"use strict";
exports.__esModule = true;
// Note: This requires that you consent to location sharing when
// prompted by your browser. If you see the error "The Geolocation service
// failed.", it means you probably did not give permission for the browser to
// locate you.
var map;
var currentLocationInfoWindow;
var circle;
var service;
var randomRestaurant;
var restaurantInfoWindow;
var markersArray;
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -36.848461, lng: 174.763336 },
        zoom: 10,
        mapTypeControl: false
    });
    markersArray = [];
    currentLocationInfoWindow = new google.maps.InfoWindow();
    restaurantInfoWindow = new google.maps.InfoWindow();
    var locationButton = document.createElement("button");
    locationButton.classList.add("custom-map-control-button");
    locationButton.textContent = "Go to current location";
    var generateRandomButton = document.createElement("button");
    generateRandomButton.classList.add("custom-map-control-button", "generate-button");
    generateRandomButton.textContent = "Find random restaurant!";
    var cuisineSelect = document.createElement("input");
    cuisineSelect.classList.add("custom-map-control-button");
    cuisineSelect.placeholder = "Input cuisine";
    var radiusInput = document.createElement("input");
    radiusInput.classList.add("custom-map-control-slider");
    setAttributes(radiusInput, {
        id: "radiusSlider",
        type: "range",
        min: 1000,
        max: 5000,
        value: 1500
    });
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(generateRandomButton);
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(cuisineSelect);
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(radiusInput);
    goToUserLocation();
    locationButton.addEventListener("click", function () {
        circle.setMap(null);
        goToUserLocation();
    });
    generateRandomButton.addEventListener("click", function () {
        findRestaurants(cuisineSelect);
    });
    radiusInput.addEventListener("input", function () {
        updateRadius(circle, parseInt(radiusInput.value));
    });
}
//helper function to set multiple attributes at once
function setAttributes(element, attrs) {
    for (var key in attrs) {
        element.setAttribute(key, attrs[key]);
    }
}
function goToUserLocation() {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            currentLocationInfoWindow.setPosition(pos);
            currentLocationInfoWindow.setContent("Current Location");
            currentLocationInfoWindow.open(map);
            map.setCenter(pos);
            map.setZoom(15);
            drawCircle();
        }, function () {
            handleLocationError(true, currentLocationInfoWindow, map.getCenter());
        });
    }
    else {
        // Browser doesn't support Geolocation
        handleLocationError(false, currentLocationInfoWindow, map.getCenter());
    }
}
//circle around user's current location
function drawCircle() {
    var _a, _b;
    var mapCenter = map.getCenter();
    var radiusElementValue = (_b = (_a = document.getElementById("radiusSlider")) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 1500;
    circle = new google.maps.Circle({
        map: map,
        center: { lat: mapCenter.lat(), lng: mapCenter.lng() },
        radius: parseInt(radiusElementValue.toString()),
        clickable: false,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35
    });
    map.fitBounds(circle.getBounds());
}
//radius slider updates
function updateRadius(circle, radius) {
    circle.setRadius(radius);
    map.fitBounds(circle.getBounds());
}
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation.");
    infoWindow.open(map);
}
//locates nearby open restaurants within the target radius
function findRestaurants(cuisine) {
    var restaurantSearchResults = [];
    clearMarkers();
    map.setCenter(circle.getCenter());
    var request = {
        location: map.getCenter(),
        radius: circle.getRadius(),
        type: "restaurant",
        openNow: true,
        keyword: cuisine.value
    };
    service = new google.maps.places.PlacesService(map);
    //performs nearby search
    service.nearbySearch(request, function (results, status, pagination) {
        var _a;
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            for (var i = 0; i < results.length; i++) {
                if (results[i].geometry &&
                    results[i].geometry.location &&
                    arePointsNear((_a = results[i].geometry) === null || _a === void 0 ? void 0 : _a.location, map.getCenter(), circle.getRadius() / 1000)) {
                    restaurantSearchResults.push(results[i].place_id);
                }
            }
            if (pagination && pagination.hasNextPage) {
                pagination.nextPage();
            }
            else {
                chooseRandom(restaurantSearchResults);
            }
        }
    });
}
//determines if a location is within the search radius
//we need this as google maps api can retrieve places outside of a specified radius
function arePointsNear(location, centerPoint, km) {
    var ky = 40000 / 360;
    var kx = Math.cos((Math.PI * centerPoint.lat()) / 180.0) * ky;
    var dx = Math.abs(centerPoint.lng() - location.lng()) * kx;
    var dy = Math.abs(centerPoint.lat() - location.lat()) * ky;
    return Math.sqrt(dx * dx + dy * dy) <= km;
}
function chooseRandom(restaurantSearchResults) {
    var randomRestaurant = restaurantSearchResults[Math.floor(Math.random() * restaurantSearchResults.length)];
    var request = {
        placeId: randomRestaurant,
        fields: ["name", "rating", "formatted_phone_number", "geometry", "url"]
    };
    service = new google.maps.places.PlacesService(map);
    service.getDetails(request, function (place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK &&
            place &&
            place.geometry &&
            place.geometry.location) {
            var a = createInfoWindow(place);
            map.setCenter(markersArray[0].getPosition());
        }
    });
}
function createMarker(place) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });
    return marker;
}
function clearMarkers() {
    for (var i = 0; i < markersArray.length; i++) {
        markersArray[i].setMap(null);
    }
    markersArray.length = 0;
}
function createInfoWindow(place) {
    restaurantInfoWindow.close();
    clearMarkers();
    var contentString = '<div id="content">' +
        '<div id="siteNotice">' +
        "</div>" +
        '<h1 id="firstHeading" class="firstHeading">' +
        place.name +
        "</h1>" +
        '<div id="bodyContent">' +
        "<p></p>" +
        '<p>More information and directions: <a href="' +
        place.url +
        '"target="_blank">' +
        place.url +
        "</a></p>" +
        "</div>" +
        "</div>";
    restaurantInfoWindow = new google.maps.InfoWindow({
        content: contentString
    });
    randomRestaurant = createMarker(place);
    markersArray.push(randomRestaurant);
    //automatically open info window
    restaurantInfoWindow.open({ anchor: randomRestaurant, map: map });
    randomRestaurant.addListener("click", function () {
        restaurantInfoWindow.open({
            anchor: randomRestaurant,
            map: map
        });
    });
}
window.initMap = initMap;
