// Global Variables

var numEvents = 20;

var cityLongitude = 0;
var cityLatitude = 0;
var event_Longitude = 0;
var event_Latitude = 0;
var venue_Name = "";

var globalMapLayer = MQ.mapLayer();
var map = L.map('map-view', {
    layers: globalMapLayer,
    center: [cityLongitude, cityLatitude],
    zoom: 12
});

function pinEvents(results) {
    // pinning events to map
    //console.log("results from pinEvents() ");
    //console.log(results);
    var longToCompare = [];
    for (var i = 0; i < numEvents; i++) {
        if (results.events[i].venue.name) {
            venue_Name = results.events[i].venue.name;
        } else {
            venue_Name = results.events[i].name.text;
        }
        event_Longitude = parseFloat(results.events[i].venue.longitude);
        //console.log("long before fix: " + event_Longitude);
        event_Longitude = event_Longitude.toFixed(4);
        //console.log("venue_Name: " + venue_Name);
        if (longToCompare.includes(event_Longitude)) {
            continue;
        } else {
            //console.log("after: " + event_Longitude);
            event_Latitude = parseFloat(results.events[i].venue.latitude);
            event_Latitude = event_Latitude.toFixed(4);
            L.marker([event_Latitude, event_Longitude]).addTo(map).bindPopup(venue_Name);
            longToCompare.push(event_Longitude);
        }
    }
}

// Weather API function
function weather() {
    let APIKey = "6bf5141aa280ab7faa386b3fe5d1454f";
    let cityWeather = $("#city-input").val().trim();

    cityWeather += ", US";
    console.log(cityWeather);

    let queryURL = "https://api.openweathermap.org/data/2.5/forecast?q=" + cityWeather + "&type=accurate&units=imperial&APPID=" + APIKey;

    // Ajax call
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        console.log(response);

        const listArray = response.list;
        $("#city").html("<h3>" + response.city.name + "</h3>");

        //loops over response from listArray and pulls each day of weather
        $.each(listArray, function (i, value) {

            //if (day === )
            // slices listArry in order to get only five days instead of 5 days with every 3 hrs 
            let time = listArray[i].dt_txt.slice(11)
            //console.log(time);

            //chooses midnight as time to display to account for UTC 7 hr difference
            if (time === "00:00:00") {
                let weatherDiv = $("<div class='weatherOnly'>");
                let day = $("<div class='d'>").text(response.list[i].dt_txt.slice(0, 10));
                //let date = new Date(day + "UTC");
                //date.toString();
                //console.log(date);
                let temp = $("<div class='t'>").text("Temp (F): " + response.list[i].main.temp);
                let wind = $("<div class='w'>").text("Wind Speed: " + response.list[i].wind.speed);
                let humidity = $("<div class='h'>").text("Humidity: " + response.list[i].main.humidity);

                weatherDiv.append(day);
                weatherDiv.append(temp);
                weatherDiv.append(wind);
                weatherDiv.append(humidity);

                const weatherArray = response.list[i].weather;

                //loops over weatherArray which is inside listArray to get description and icon of weather for day displayed
                $.each(weatherArray, function (k, value) {
                    let weatherDes = $("<div class='description'>").text(response.list[i].weather[k].description.toUpperCase());
                    let image = $("<img>").attr("src", "http://openweathermap.org/img/w/" + weatherArray[k].icon + ".png")
                    weatherDiv.append(weatherDes);
                    weatherDes.append(image);

                });
                $("#city").append(weatherDiv);

            }
        });
        $(".daysWeather").show();

        cityLongitude = response.city.coord.lon;
        //console.log("longitude: " + cityLongitude);
        cityLatitude = response.city.coord.lat;
        //console.log("latitude: " + cityLatitude);
        map.panTo(new L.LatLng(cityLatitude, cityLongitude));
        //var cityMarker = L.marker([cityLatitude, cityLongitude]).addTo(map);
    });
}

// EventBrite API
function eventBriteInfo() {

    // Use location var with $("#city-input") submission
    var location = $("#city-input").val().trim();
    var queryURL = "https://www.eventbriteapi.com/v3/events/search/?expand=venue,category,subcategory,ticket,format,image&token=SZDJEP44NSPTC2RGIFBQ&location.address=" + location;

    // AJAX Call
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {

        var results = response;
        pinEvents(results);

        for (var j = 0; j < 20; j++) {
            var eventFig = $('<fig id="event-box">');

            var imgURL = results.events[j].logo.url;
            var name = results.events[j].name.text;
            var category = results.events[j].category.name;
            var time = results.events[j].start.local;
            var localAddress = results.events[j].venue.address.localized_address_display;
            var link = results.events[j].url;

            var image = $('<img class="event-img">');
            image.attr("src", imgURL);

            var title = $("<div>");
            title.append(name);

            var genre = $("<div>");
            genre.append(category);

            var timeMoment = moment(time).format("dddd, MMMM Do YYYY, h:mm a");

            var start = $("<div>");
            start.append(time);

            var address = $("<div>");
            address.append(localAddress);

            var clickMore = $("<a href>")
            clickMore.text("See full event details...");
            clickMore.attr("id", "clickDetails");
            clickMore.attr("data-link", link);

            eventFig.append(image);
            eventFig.append(title);
            eventFig.append(genre);
            eventFig.append(timeMoment);
            eventFig.append(address);
            eventFig.append(clickMore);

            $("#events-view").prepend(eventFig);

            $("#clickDetails").on("click", function (event) {
                event.preventDefault();
                window.open($(this).attr("data-link"), '_blank');
            })
        }
    });
}

//Adds different view options, such as street map, satellite image or hybrid of both
function loadMap() {
    //centers map to user position and pop's up there
    var baseMaps = {
        'Map': globalMapLayer,
        'Hybrid': MQ.hybridLayer(),
        'Satellite': MQ.satelliteLayer()
    };
    L.control.layers(baseMaps).addTo(map);
    var popup = L.popup();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var latLng = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            popup.setLatLng(latLng);
            popup.setContent('This is your current location');
            popup.openOn(map);

            map.setView(latLng);
        }, function () {
            geolocationErrorOccurred(true, popup, (map.getCenter()));
        });
    } else {
        //No browser support geolocation service
        geolocationErrorOccurred(false, popup, (map.getCenter()));
    }

    function geolocationErrorOccurred(geolocationSupported, popup, latLng) {
        popup.setLatLng(latLng);
        popup.setContent(geolocationSupported ?
            '<b>Error:</b> The Geolocation service failed.' :
            '<b>Error:</b> This browser doesn\'t support geolocation.');
        popup.openOn(map);
    }
}

/* function cityInfo() {
    console.log("inside cityInfo");
    var city = $("#city-input").val().trim();
    var queryURL = "https://api.teleport.org/api/cities/?search=" + city;

    // AJAX Call
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {

        console.log("cityInfo:");
        console.log(response);
    });
} */

// Initializers on Page Load Up
$(document).ready(function () {
    //hides our html for when user just clicks without input
    loadMap();
    $("#forgot-city").hide();
    $(".daysWeather").hide();
    $("#add-city").on("click", function (event) {

        event.preventDefault();

        //keeps user from clicking button with no input
        let userInput = $("#city-input").val().trim();

        if (userInput.length > 0) {
            //API Initializers (Call API functions below so that they will run on submit)
            //cityInfo();

            $("#events-view").empty();
            eventBriteInfo();
            weather();

            $("#forgot-city").hide();
        } else {
            $("#forgot-city").show();
        }

        //Clears input field after button click
        $("#city-input").val(" ");
    })
});