//I made these variables accessable outside of a function so other functions could edit them.
var yearRanges = [2011,2012,2013,2014,2015,2016,2017,2018];
var yearValue = document.getElementById("year");
yearValue.innerHTML = yearRanges[0];
function createMap(){
    //create the map
    var map = new L.map('mapid').setView([37.8, -96], 4);
    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map)
	// Create legend
    //call ajax function
    getData(map);
};

//update points when slider is pressed
function updatePropSymbols(map,attribute){
    //Update points 
	var findLayers = new L.layerGroup();
    map.eachLayer(function(layer){
		findLayers.addLayer(layer);
        if(layer.feature && layer.feature.properties[attribute]){
            var props = layer.feature.properties;
            var radius = getSize(props[attribute]);
			var options = {
                radius: radius,
                color: "#000",
                weight: 1,
                opacity: 1, 
                fillOpacity: 0.8,
				fillColor: 'white'
                	};
            layer.setStyle(options);
	    //Refresh pop ups
            var year = attribute.split("_")[1];
			var popupContent ="<p><b>Attendance in " + year + ":</b> "+ props[attribute] + "</p>";
            var panelContent = "<p><b>Team:</b> " +props.Team + "</p>";
			panelContent += "<p><b>Stadium:</b> " +props.Stadium + "</p>";
            layer.bindPopup(popupContent,{
                offest: new L.point(0,-radius)
            });
			
			layer.on({
			mouseover: function(){
				this.openPopup();
				},
			mouseout: function(){
				this.closePopup();
				},
			click: function(){
				$("#popupPanel").html(panelContent);
				}
			});
			layer.redraw();
			layer.addTo(map);
        };
    });
};
//Create slider and buttons
function createSquenceControls(map, attributes){
   //Create an array to store button names
    var divisions = ["All","AL Central", "AL East", "AL West", 'NL Central', 'NL East', 'NL West'];
     //Create Slider
    $("#panel").append('<input class="range-slider" type="range"> <br><br> <div id= "popUpCont" class="container-fluid"><b><h2>Stadium Info</h2></b><p id= "popupPanel"><b>Click Stadium to get Name and Attendance</b></p></div>');
    $('.range-slider').attr({
        max: 7,
        min: 0,
        value: 0,
        step: 1
    });
	//Create filter panel and create buttons.
	$("#panel").append('<br><div id = "filterPanel" class = "btn-group"><h2>Divisions Filter</h2></div>');
	for (var i = 0; i < divisions.length; i++){
		divis = divisions[i];
		console.log(divisions[i]);
		$("#filterPanel").append('<div id= "' + divis + '"><button id= "' + String(divis) + '" class= "skip">' + divis + '</button></div>' );
	};

    //Create forward and reverse buttons
    $('#reverse').append('<button class="skip" id="reverse">-</button>');
    $('#forward').append('<button class="skip" id="forward">+</button>');
    
	
    //Get value from slider
    $('.skip').click(function(){
        var index = $('.range-slider').val();
        //Increase value on forward button press
        if ($(this).attr('id') == 'forward'){
            index++;
	    //If value goes above 7 then it resets to 0
            index = index > 7 ? 0: index;
	  //Decrease value on reverse press
        } else if ($(this).attr('id') == 'reverse'){
            index--;
	    //If value goes below 0 then it goes to 7
            index = index < 0 ? 7: index;
        };
	//Use value from buttons to run updatePropSymbols.
    $('.range-slider').val(index);
	yearValue.innerHTML = yearRanges[index];
	updatePropSymbols(map, attributes[index]);
	updateLegend(map,attributes[index]);
    });
    //Use value selected from slider to run updatePropSymbosl
    $('.range-slider').on('input',function(){
        var index = $(this).val();
		yearValue.innerHTML = yearRanges[index];
        updatePropSymbols(map, attributes[index]);
		updateLegend(map,attributes[index]);
    });
   
};

//Get values of Attend attributes
function processData(data){
    var attributes = [];
    
    var properties = data.features[0].properties;
    
    for(var attribute in properties){
        if(attribute.indexOf("Attend")>-1){
            attributes.push(attribute);
        };
    };
    console.log(attributes);
    
    return attributes;
}

	



//Create ranges of colors based on Attendance value
function getSize(d){
return (d/800000)*3};

//Create Legend
function createLegend(map, attributes){
	var LegendControl = L.Control.extend({
		options: {
			position: 'bottomleft'
		},
		onAdd: function(map) {
			var container = L.DomUtil.create('div', 'legend-control-container');

            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')

            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="160px" height="100px">';
			
			var circles = {
            max: 20,
            mean: 40,
            min: 60
        };

        //loop to add each circle and text to svg string
        for (var circle in circles){
            //circle string
            svg += '<circle class="legend-circle" id="' + circle + '" fill="white" fill-opacity="0.8" stroke="#000000" cx="30"/>';

            //text string
            svg += '<text id="' + circle + '-text" x="60" y="' + circles[circle] + '"></text>';
        };

			//close svg string
			svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);
			
			return container;
		}
	});
	map.addControl(new LegendControl());
	
	updateLegend(map, attributes[0]);
};

//Update the legend with new attribute
function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("_")[1];
    var content = "<b>Attendance in " + year+'</b>';

    //replace legend content
    $('#temporal-legend').html(content);
	
	var circleValues = getCircleValues(map, attribute);
	
	for (var key in circleValues){
		var radius = getSize(circleValues[key]);
		
		$('#' +key).attr({
			cy:50 - radius,
			r: radius
		});
		
		$('#'+key+'-text').text(Math.round(circleValues[key]) + " People");
	};
};

function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};



//Create points to layer attributes and functions for geoJson Layer
function pointToLayer(feature, latlng, attributes){
	
	
    //Attributes intialized at 0 postions in array.
    var attribute = attributes[0];
    //console.log(attribute);
	
    //Create options for points layer
    var geojsonMarkerOptions = {
                fillColor: 'white',
                color: "#000",
                weight: 1,
                opacity: 1, 
                fillOpacity: 0.8
                };
    //Get number value of Attributes property	
    var attValue = Number(feature.properties[attribute]);
    
    //Create point color based on Attribute value
    geojsonMarkerOptions.radius = getSize(attValue);
    
    //Create circel markers and assign attributes
    var layer = L.circleMarker(latlng,geojsonMarkerOptions);
    
    //Extraxt year value from attribute
    var year = attribute.split("_")[1];
    
    //Create panelContent and popupContent for points and side panel
    var panelContent ="<p><b>Stadium:</b> "+ feature.properties.Stadium + "</p>";
	panelContent += "<p><b>Team:</b> "+feature.properties.Team + "</p>";
	var popupContent = "<p><b>Attendance in " + year + ":</b> "+feature.properties[attribute] + "</p>";
    
    //add popup content to points	
    layer.bindPopup(popupContent);
    //Make pop up content viewble once point is hovered over.
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
	//add panelContent once point is clicked
        click: function(){
            $("#popupPanel").html(panelContent);
        }
    });
    
    return layer;
};

//Create Geojson Layer and marker cluster
function createColorSymbols(data, map,attributes){
     //Create geoJson layers for based on division attribute and pointToLayer options
	var alc = L.geoJson(data, {
		pointToLayer: function(feature, latlng){
			return pointToLayer(feature,latlng,attributes);
		},
		filter: function(feature, layer){
					return feature.properties.Division == 'AL Central';
					}
				});
	
	var ale = L.geoJson(data, {
		pointToLayer: function(feature, latlng){
			return pointToLayer(feature,latlng,attributes);
		},
		filter: function(feature, layer){
					return feature.properties.Division == 'AL East';
					}
				});
	
	var alw = L.geoJson(data, {
		pointToLayer: function(feature, latlng){
			return pointToLayer(feature,latlng,attributes);
		},
		filter: function(feature, layer){
					return feature.properties.Division == 'AL West';
					}
				});
				
	var nlc = L.geoJson(data, {
		pointToLayer: function(feature, latlng){
			return pointToLayer(feature,latlng,attributes);
		},
		filter: function(feature, layer){
					return feature.properties.Division == 'NL Central';
					}
				});			
	
	var nle = L.geoJson(data, {
		pointToLayer: function(feature, latlng){
			return pointToLayer(feature,latlng,attributes);
		},
		filter: function(feature, layer){
					return feature.properties.Division == 'NL East';
					}
				});
	
	var nlw = L.geoJson(data, {
		pointToLayer: function(feature, latlng){
			return pointToLayer(feature,latlng,attributes);
		},
		filter: function(feature, layer){
					return feature.properties.Division == 'NL West';
					}
				});
	//Group all GeoJson Layers into a Group Layer
	var teamGroup = L.layerGroup([alc, ale, alw, nlc, nle, nlw]);
	
	//Create Search Box
	var searchTeams = new L.Control.Search({
		position: 'topright',
		//propertyName chooses what property in the GeoJson is being searched
		propertyName: "Team",
		layer: teamGroup,
		intial: false,
		zoom: 15,
		marker: false
	});
	
	//Create click functions to work with with the filter panel
	$('.skip').click(function(){
        if ($(this).attr('id') == 'AL Central'){
           map.removeLayer(teamGroup);
		   teamGroup = L.layerGroup([alc]);
		   map.addLayer(teamGroup);
		   $('.range-slider').val(0);
			yearValue.innerHTML = yearRanges[0];
			updatePropSymbols(map, attributes[0]);
			updateLegend(map,attributes[0]);
        } else if ($(this).attr('id') == 'AL East'){
			map.removeLayer(teamGroup);
			teamGroup = L.layerGroup([ale]);
			map.addLayer(teamGroup);
			$('.range-slider').val(0);
			yearValue.innerHTML = yearRanges[0];
			updatePropSymbols(map, attributes[0]);
			updateLegend(map,attributes[0]);
		} else if ($(this).attr('id') == 'AL West'){
			map.removeLayer(teamGroup);
			teamGroup = L.layerGroup([alw]);
			map.addLayer(teamGroup);
			$('.range-slider').val(0);
			yearValue.innerHTML = yearRanges[0];
			updatePropSymbols(map, attributes[0]);
			updateLegend(map,attributes[0]);
		} else if ($(this).attr('id') == 'NL Central'){
			map.removeLayer(teamGroup);
			teamGroup = L.layerGroup([nlc]);
			map.addLayer(teamGroup);
			$('.range-slider').val(0);
			yearValue.innerHTML = yearRanges[0];
			updatePropSymbols(map, attributes[0]);
			updateLegend(map,attributes[0]);
		} else if ($(this).attr('id') == 'NL East'){
			map.removeLayer(teamGroup);
			teamGroup = L.layerGroup([nle]);
			map.addLayer(teamGroup);
			$('.range-slider').val(0);
			yearValue.innerHTML = yearRanges[0];
			updatePropSymbols(map, attributes[0]);
			updateLegend(map,attributes[0]);
		} else if ($(this).attr('id') == 'NL West'){
			map.removeLayer(teamGroup);
			teamGroup = L.layerGroup([nlw]);
			map.addLayer(teamGroup);
			$('.range-slider').val(0);
			yearValue.innerHTML = yearRanges[0];
			updatePropSymbols(map, attributes[0]);
			updateLegend(map,attributes[0]);
		} else if ($(this).attr('id') == 'All'){
			map.removeLayer(teamGroup);
			teamGroup = L.layerGroup([alc, ale, alw, nlc, nle, nlw]);
			map.addLayer(teamGroup);
			$('.range-slider').val(0);
			yearValue.innerHTML = yearRanges[0];
			updatePropSymbols(map, attributes[0]);
			updateLegend(map,attributes[0]);
		}
        });

	//markers.addLayer(teamGroup);
        map.addLayer(teamGroup);
	//Add Search box to map
	map.addControl(searchTeams);
		};
//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    $.ajax("data/stadiums.geojson", {
        dataType: "json",
        success: function(response){
        var attributes = processData(response);
        //create basic marker options
	    createSquenceControls(map, attributes);
        createColorSymbols(response, map, attributes);
		createLegend(map,attributes);
	    console.log(map);
            
            
        }
    });
};

$(document).ready(createMap);
