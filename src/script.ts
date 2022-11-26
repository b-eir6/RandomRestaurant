// Note: This requires that you consent to location sharing when
// prompted by your browser. If you see the error "The Geolocation service
// failed.", it means you probably did not give permission for the browser to
// locate you.
var map: google.maps.Map;
var currentLocationInfoWindow: google.maps.InfoWindow;
var circle: google.maps.Circle;
var service: google.maps.places.PlacesService;
var randomRestaurant: google.maps.Marker;
var restaurantInfoWindow: google.maps.InfoWindow;
var markersArray: google.maps.Marker[];

function initMap(): void {
  map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
    center: { lat: -36.848461, lng: 174.763336 },
    zoom: 10,
    mapTypeControl: false,
  });

  markersArray = [];
  currentLocationInfoWindow = new google.maps.InfoWindow();
  restaurantInfoWindow = new google.maps.InfoWindow();

  const locationButton = document.createElement("button");
  locationButton.classList.add("custom-map-control-button");
  locationButton.textContent = "Go to current location";

  const generateRandomButton = document.createElement("button");
  generateRandomButton.classList.add(
    "custom-map-control-button",
    "generate-button"
  );
  setAttributes(generateRandomButton, { id: "generateButton" });
  generateRandomButton.textContent = "Find random restaurant!";

  const cuisineSelect = document.createElement("input");
  cuisineSelect.classList.add("custom-map-control-button");
  cuisineSelect.placeholder = "Input cuisine";

  const radiusInput = document.createElement("input");
  radiusInput.classList.add("custom-map-control-slider");
  setAttributes(radiusInput, {
    id: "radiusSlider",
    type: "range",
    min: 1000,
    max: 5000,
    value: 1500,
  });

  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
  map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(
    generateRandomButton
  );
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(cuisineSelect);
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(radiusInput);

  goToUserLocation();

  locationButton.addEventListener("click", () => {
    circle.setMap(null);
    goToUserLocation();
  });

  generateRandomButton.addEventListener("click", () => {
    findRestaurants(cuisineSelect);
  });

  radiusInput.addEventListener("input", () => {
    updateRadius(circle, parseInt(radiusInput.value));
  });

  map.addListener("click", (e: { latLng: google.maps.LatLng }) => {
    placeCircleAndPanTo(e.latLng, map);
  });
}

function placeCircleAndPanTo(latLng: google.maps.LatLng, map: google.maps.Map) {
  circle.setCenter(latLng);
  map.panTo(latLng);
}

//helper function to set multiple attributes at once
function setAttributes(element: any, attrs: any) {
  for (var key in attrs) {
    element.setAttribute(key, attrs[key]);
  }
}

function goToUserLocation() {
  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        currentLocationInfoWindow.setPosition(pos);
        currentLocationInfoWindow.setContent("Current Location");
        currentLocationInfoWindow.open(map);
        map.setCenter(pos);
        map.setZoom(15);
        drawCircle();
      },
      () => {
        handleLocationError(true, currentLocationInfoWindow, map.getCenter()!);
      }
    );
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, currentLocationInfoWindow, map.getCenter()!);
  }
}

//circle around user's current location
function drawCircle() {
  var mapCenter = map.getCenter()!;
  var radiusElementValue =
    (document.getElementById("radiusSlider") as HTMLInputElement)?.value ??
    1500;

  circle = new google.maps.Circle({
    map,
    center: { lat: mapCenter.lat(), lng: mapCenter.lng() },
    radius: parseInt(radiusElementValue.toString()), //meters
    clickable: false,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
  });

  map.fitBounds(circle.getBounds()!);
}

//radius slider updates
function updateRadius(circle: google.maps.Circle | undefined, radius: number) {
  if (circle === undefined) {
    return;
  } else {
    circle.setRadius(radius);
    map.fitBounds(circle.getBounds()!);
  }
}

function handleLocationError(
  browserHasGeolocation: boolean,
  infoWindow: google.maps.InfoWindow,
  pos: google.maps.LatLng
) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

//locates nearby open restaurants within the target radius
function findRestaurants(cuisine: HTMLInputElement) {
  var restaurantSearchResults: string[] = [];
  var button = document.getElementById("generateButton") as HTMLButtonElement;

  button.disabled = true;
  clearMarkers();
  map.setCenter(circle.getCenter()!);

  var request = {
    location: map.getCenter(),
    radius: circle.getRadius(),
    type: "restaurant",
    openNow: true,
    keyword: cuisine.value,
  };
  service = new google.maps.places.PlacesService(map);

  //performs nearby search
  service.nearbySearch(
    request,
    (
      results: google.maps.places.PlaceResult[] | null,
      status: google.maps.places.PlacesServiceStatus,
      pagination: google.maps.places.PlaceSearchPagination | null
    ) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        for (let i = 0; i < results.length; i++) {
          if (
            results[i].geometry &&
            results[i].geometry!.location &&
            arePointsNear(
              results[i].geometry?.location,
              map.getCenter(),
              circle.getRadius() / 1000
            )
          ) {
            restaurantSearchResults.push(results[i].place_id!);
          }
        }
        if (pagination && pagination.hasNextPage) {
          pagination.nextPage();
        } else {
          chooseRandom(restaurantSearchResults);
          button.disabled = false;
        }
      }
    }
  );
}

//determines if a location is within the search radius
//we need this as google maps api can retrieve places outside of a specified radius
function arePointsNear(
  location: google.maps.LatLng | undefined,
  centerPoint: google.maps.LatLng | undefined,
  km: number
): boolean {
  if (location === undefined || centerPoint === undefined) {
    return false;
  }
  var ky = 40000 / 360;
  var kx = Math.cos((Math.PI * centerPoint.lat()) / 180.0) * ky;
  var dx = Math.abs(centerPoint.lng() - location.lng()) * kx;
  var dy = Math.abs(centerPoint.lat() - location.lat()) * ky;
  return Math.sqrt(dx * dx + dy * dy) <= km;
}

function chooseRandom(restaurantSearchResults: string | any[]) {
  var randomRestaurant =
    restaurantSearchResults[
      Math.floor(Math.random() * restaurantSearchResults.length)
    ];
  var request = {
    placeId: randomRestaurant,
    fields: ["name", "rating", "formatted_phone_number", "geometry", "url"],
  };

  service = new google.maps.places.PlacesService(map);

  service.getDetails(
    request,
    (
      place: google.maps.places.PlaceResult | null,
      status: google.maps.places.PlacesServiceStatus
    ) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        place &&
        place.geometry &&
        place.geometry.location
      ) {
        createInfoWindow(place);
        map.setCenter(markersArray[0].getPosition()!);
      }
    }
  );
}

function createMarker(
  place: google.maps.places.PlaceResult
): google.maps.Marker {
  const marker = new google.maps.Marker({
    map,
    position: place.geometry!.location,
  });

  return marker;
}

function clearMarkers() {
  for (var i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }
  markersArray.length = 0;
}

function createInfoWindow(place: google.maps.places.PlaceResult) {
  restaurantInfoWindow.close();
  clearMarkers();
  const contentString =
    '<div id="content">' +
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
    content: contentString,
  });

  randomRestaurant = createMarker(place);
  markersArray.push(randomRestaurant);

  //automatically open info window
  restaurantInfoWindow.open({ anchor: randomRestaurant, map });

  randomRestaurant.addListener("click", () => {
    restaurantInfoWindow.open({
      anchor: randomRestaurant,
      map,
    });
  });
}

declare global {
  interface Window {
    initMap: () => void;
  }
}
window.initMap = initMap;
export {};
