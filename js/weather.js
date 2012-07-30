function populateWeatherConditions(weatherCondition) {
    var tmpl, output;

    emptyContent();

    forge.logging.log('beginning populating weather conditions');

    tmpl = $('#forecast_information_tmpl').html();
    output = Mustache.to_html(tmpl, weatherCondition.forecast);
    $('#forecast_information').append(output);
    forge.logging.log('finished populating forecast information');

    tmpl = $('#current_conditions_tmpl').html();
    output = Mustache.to_html(tmpl, weatherCondition.currentConditions);
    $('#current_conditions').append(output);
    forge.logging.log('finished populating current conditions');

    tmpl = $('#forecast_conditions_tmpl').html();
    output = Mustache.to_html(tmpl, {conditions: weatherCondition.forecastConditions});
    $('#forecast_conditions').append(output);
    forge.logging.log('finished populating forecast conditions');

    forge.logging.log('finished populating weather conditions');
};

function getWeatherInfo(location, callback){
    forge.logging.log('[getWeatherInfo] getting weather for for '+location);
    forge.request.ajax({
        url:"http://www.google.com/ig/api?weather="+encodeURIComponent(location),
        dataType: 'xml',
        success: function (data) {
            forge.logging.log('[getWeatherInfo] success');
            var weatherObj = buildWeather(data);
            callback(weatherObj);
        },
        error: function (error){
            forge.logging.error('[getWeatherInfo] '+JSON.stringify(error));
        }
    });
};

var xmlToJson = function(doc, keys) {
    /** Transforms an XML document into JSON

    doc is a document
    keys is an array of strings, specifying the names of XML nodes to pull from the document
    */
    var result = {};

    for (var counter=0; counter<keys.length; counter+=1) {
        result[keys[counter]] = $(keys[counter], doc).attr('data');
    }
    return result;
}

function formatImgSrc(imgURL) {
    return 'resources/'+/[a-z_]*.gif/.exec(imgURL)[0];
};

function formatDateTime(dateTime) {
    var d = new Date();
    return d.toDateString() + ' ' + d.toLocaleTimeString();
};

function buildForecastInformation(forecastInformation) {
    forge.logging.log('[buildForecastInformation] building internal forecast information object');

    var forecastInformation = xmlToJson(forecastInformation, ['city', 'forecast_date', 'current_date_time']);
    forecastInformation['current_date_time'] = formatDateTime(forecastInformation['current_date_time']);

    return forecastInformation;
};

function buildCurrentCondition(currentCondition) {
    forge.logging.log('building current conditions object');

    var currentCondition = xmlToJson(currentCondition, ['condition', 'temp_f', 'humidity', 'icon', 'wind_condition']);
    currentCondition['icon'] = formatImgSrc(currentCondition['icon']);

    return currentCondition;
};

function buildForecastConditions(forecastConditions) {
    var convertedForecastConditions = [];
    $(forecastConditions).each(function(index, element) {
        convertedForecastConditions.push(buildForecastCondition(element));
    });
    return convertedForecastConditions;
};

function buildForecastCondition(forecastCondition) {
    forge.logging.log('[buildForecastCondition] building forecast condition');

    var forecastCondition = xmlToJson(forecastCondition, ['day_of_week', 'low', 'high', 'icon', 'condition']);
    forecastCondition['icon'] = formatImgSrc(forecastCondition['icon']);

    return forecastCondition;
};

function buildWeather(parsedData) {
    forge.logging.log('[buildWeather] converting data to internal representation');

    var forecastInformation = buildForecastInformation($('forecast_information', parsedData));
    var currentConditions = buildCurrentCondition($('current_conditions', parsedData))
    var forecastConditions = buildForecastConditions($('forecast_conditions', parsedData));

    return {
        forecast: forecastInformation,
        currentConditions: currentConditions,
        forecastConditions: forecastConditions
    }
};

function emptyContent() {
    forge.logging.log('removing old data');

    $('#forecast_information').empty();
    $('#current_conditions').empty();
    $('#forecast_conditions').empty();

    forge.logging.log('finished emptying content');
};

$(function() {
    var cities = ['Annapolis', 'Boston', 'Chicago', 'Dayton', 'Niagra Falls',
        'Raleigh', 'Salem'];

    cities.forEach(function(city) {
        $('#city_menu').append('<option>'+city+'</option>');
    });

    $('#city_menu').change(function() {
        var city = $("#city_menu option:selected").html();
        forge.prefs.set('city', city);
        getWeatherInfo(city, populateWeatherConditions);
    });

    forge.prefs.get('city',
        function(resource) {
            var city = resource || 'Boston';
            $('#city_menu').val(city);
            $('#city_menu').change();
        }, function (error) {
            forge.logging.error('failed when retrieving city preferences');
            $('#city_menu').val('Boston'); //default;
        }
    );

    forge.topbar.setTitle('Weather');

    forge.topbar.addButton({
        icon: 'img/refresh.png',
        position: 'right'
    }, function () {
        forge.logging.log('reloading weather data');
        var city = $("#city_menu option:selected").html();
        getWeatherInfo(city, populateWeatherConditions);
    });
});
