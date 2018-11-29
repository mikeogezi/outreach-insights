var apiKey = 'AIzaSyD7xFbJB99jG3BMQIFJy1mN4kcuxMMlcyU'

var urlBase = '/' || 'https://livefirefighter.herokuapp.com/'

$(document).ready(function docReadyFunction() {
    function setup() {
        setPopulation()
        $('.modal').modal()
        $('select').formSelect()
        $('#lga-select').change(function () {
            console.log('LGA Select Change')
            $('#settlement-search').val('')
            $('#settlement-search').attr('disabled', 'disabled')
            var stateName = getStateName()
            var LGAName = getLGAName()
            makeSettlementsRequest(stateName, LGAName, function () {
                $('#settlement-search').removeAttr('disabled')
            })
        })
        $('#search-btn').click(function () {
            onClickSearch()
        })
        $('#closest-health-facilities-btn').click(function () {
            onClickClosestFacilities()
        })
        $('#neighboring-settlements-btn').click(function () {
            onClickNeighboringSettlements()
        })
        $('#lga-select').change() // Load settlements for default LGA
    }

    setup()
});

// 10.1590° N, 8.1339° E
var Kaduna = {
    location: {
        lat: 10.1590,
        lng: 8.1339
    }
};

var map
var settlements
var LGAs
var states

function getStateName() {
    return $('#state-select').val()
}

function getLGAName() {
    return $('#lga-select').val()
}

function getSettlementName() {
    return $('#settlement-search').val()
}

function setPopulation(stateVal, lgaVal, sVal) {
    console.log('setPopulation')

    var stateNum = parseInt(stateVal) || '-'
    var lgaNum = parseInt(lgaVal) || '-'
    var sNum = parseInt(sVal) || '-'
    $('#population').html('<b><small>State: </small></b><text class="right_">' + stateNum.toLocaleString() + '</span><br />' +
        '<b><small>LGA: </small></b><text class="right_">' + lgaNum.toLocaleString() + '</span><br />' +
        '<b><small>Settlement: </small></b><text class="right_">' + sNum.toLocaleString() + '</span><br />'
    )
}

function setDoctorsPer100K(val) {
    console.log('setDoctorsPer100K')

    var num = new Number(val)
    $('#doctors-per-100k').text(num.toLocaleString())
}

function onClickClosestFacilities() {
    console.log('onClickClosestFacilities')
}

function onClickNeighboringSettlements() {
    console.log('onClickNeighboringSettlements')
}

function showInvalidSettlementError() {
    console.log('showInvalidSettlementError')

    M.toast({
        html: '<i class="material-icons">warning</i>&nbsp;&nbsp;&nbsp;You submitted an invalid query. Please try again.',
        classes: 'rounded'
    })
}

function showBadNetworkError() {
    console.log('showBadNetworkError')

    M.toast({
        html: '<i class="material-icons">signal_wifi_off</i>&nbsp;&nbsp;&nbsp;The page didn\'t load properly. Check your connection then reload the page.',
        classes: 'rounded'
    })
}

function calculatePolygonArea(feature) {
    var area = 0
    var coords = extractCoords(feature)
    var j = coords.length - 1

    for (var i = 0, len = coords.length; i < len; i++) {
        area = area + (coords[j][1] + coords[i][1]) * (coords[j][0] - coords[i][0])
        j = i;
    }

    return Math.pow(Math.abs(area / 2) * 180 / Math.PI, 2)
}

function calculateDistanceShort(coordL, coordR, unit) {
    console.log('calculateDistanceShort')

    var latDiff = coordL.lat - coordR.lat
    var lngDiff = coordL.lng - coordR.lng
    var distance = Math.sqrt(Math.pow(latDiff, 2) + Math.pow(lngDiff, 2))
    // console.log(distance)
    distance = distance * 60 * 1.1515
    if (unit == "K") { // kilometre
        return distance * 1.609344
    }
    if (unit == "N") { // nautical mile
        return distance * 0.8684
    }
    return distance
}

function calculateDistance(coordL, coordR, unit) {
    console.log('calculateDistance')

    var rCL = {
        lat: Math.PI * coordL.lat / 180,
        lng: Math.PI * coordL.lng / 180
    }
    var rCR = {
        lat: Math.PI * coordR.lat / 180,
        lng: Math.PI * coordR.lng / 180
    }
    // console.log(rCL, rCR)
    var theta = coordL.lng - coordR.lng
    var rTheta = Math.PI * theta / 180
    var distance = Math.sin(rCL.lat) * Math.sin(rCR.lat) + Math.cos(rCL.lat) * Math.cos(rCR.lat) * Math.cos(rTheta)
    // console.log(theta, rTheta, distance)
    distance = Math.acos(distance)
    // console.log(distance)
    distance = distance * 180 / Math.PI
    // console.log(distance)
    distance = distance * 60 * 1.1515
    // console.log(distance)
    if (unit == "K") { // kilometre
        return distance * 1.609344
    }
    if (unit == "N") { // nautical mile
        return distance * 0.8684
    }
    return distance
}

function sortByDistanceFromRef(features, refCoord) {
    console.log('sortByDistanceFrom')

    for (var i = 0, len = features.length; i < len; ++i) {
        var center = getCenter(features[i])
        var distance = calculateDistanceShort(center, refCoord, 'K')
        // console.log('Center: ', center, '\n', distance, 'KM', refCoord)
        features[i].distance = distance
    }

    features.sort(function (l, r) {
        return l.distance - r.distance
    })
}

function onClickSearch() {
    console.log('onSearchClicked')

    if (!map) {
        showBadNetworkError()
        return
    }

    var stateName = getStateName()
    var LGAName = getLGAName()
    var settlementName = getSettlementName()

    var sObj = getSettlementObj(settlementName)
    if (!sObj) {
        showInvalidSettlementError()
        return
    }

    var center = getCenter(sObj)

    setDistanceFromInModal()
    focusAndTag(center, settlementName)
    drawPolygonOnLocation(sObj, settlementName, blue)
    map.setCenter(center)

    fetchPopulationData(sObj)
    fetchDoctorPer100kData(sObj)
    fetchClosestHealthFacilties(sObj)
    fetchNeighboringSettlements(sObj)
    generateInsights(sObj)
}

function fetchDoctorPer100kData() {
    console.log('fetchDoctorPer100kData')

    var doctorsP100k = 8252400 / 40000 / 37

    setDoctorsPer100K(doctorsP100k.toFixed(2))
}

function fetchClosestHealthFacilties() {
    console.log('fetchClosestHealthFacilties')
}

function fetchNeighboringSettlements() {
    console.log('fetchNeighboringSettlements')
}

function generateInsights() {
    console.log('generateInsights')
}

function makeSettlementsRequest(stateName, LGAName, cb) {
    console.log('makeSettlementsRequest')

    $.get(urlBase + 'getSettlements?state=' + stateName + '&lga=' + LGAName, function (data, textStatus, jqXHR) {
        window.settlements = data
        // console.log('Settlements: ', settlements)
        var aData = {}
        for (var i in settlements) {
            var s = settlements[i]
            aData[s.properties.name] = null

            $('#settlement-search').autocomplete({
                data: aData,
            })
        }

        cb()
    })
}

function extractCoords(feature) {
    console.log('extractCoords')

    var coords

    if (typeof feature.geometry.coordinates[0][0][0] == 'object') {
        coords = feature.geometry.coordinates[0][0]
    } else {
        coords = feature.geometry.coordinates[0]
    }

    return coords
}

function getBounds(feature) {
    console.log('getBounds')

    var bounds = new google.maps.LatLngBounds()
    var coords = extractCoords(feature)

    for (var coord of coords) {
        // console.log('Coord: ', coord[1], coord[0])
        bounds.extend(new google.maps.LatLng(coord[1], coord[0]))
    }

    return bounds
}

function getCenter(feature) {
    console.log('getCenter')

    var c = getBounds(feature).getCenter()

    return {
        lat: c.lat(),
        lng: c.lng()
    }
}

function getSettlementObj(settlementName) {
    console.log('getSettlementObj')

    if (window.settlements != null) {
        for (var s of settlements) {
            if (s.properties.name == settlementName) {
                return s
            }
        }
    }

    return null
}

var marker

function focusAndTag(coord, name) {
    console.log('focusAndTag')

    clearMarker(marker)
    marker = new google.maps.Marker({
        position: coord,
        map: map,
        label: name,
        title: name,
        draggable: false,
        animation: google.maps.Animation.BOUNCE
    })

    map.setCenter(coord)

    return marker
}

function clearMarker(marker) {
    if (marker) {
        marker.setMap(null)
        marker = null
    }
}

function clearPolygon(polygon) {
    if (polygon) {
        polygon.setMap(null)
        polygon = null
    }
}

function toLatLngObjArray(coordArr) {
    console.log('toLatLngObjArray')

    var coordObjs = []

    for (var coord of coordArr) {
        // console.log(coord)
        coordObjs.push({
            lat: coord[1],
            lng: coord[0]
        })
    }

    // console.log('Coordinates:', coordObjs, coordArr)
    return coordObjs
}

var blue = '#4285f4'
var teal = '#009688'
var red = '#E51C23'

var polygon
var statePolygon

function drawPolygonOnLocation(feature, name, color) {
    console.log('drawPolygonOnLocation')

    color = color || blue

    // console.log(feature)
    var coords = extractCoords(feature)
    var latLngArr = toLatLngObjArray(coords)
    // console.log(coords, latLngArr)

    // State
    if (color != teal) {
        statePolygon = new google.maps.Polygon({
            paths: latLngArr,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 1.5,
            fillColor: color,
            fillOpacity: 0.35,
            title: name
        })
        statePolygon.setMap(map)
    } else {
        clearPolygon(polygon)
        polygon = new google.maps.Polygon({
            paths: latLngArr,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 1.5,
            fillColor: color,
            fillOpacity: 0.35,
            title: name
        })
        polygon.setMap(map)
    }

    map.fitBounds(getBounds(feature))

    setTimeout(function () {
        reduceZoom()
        reduceZoom()
        adjustMap()
    }, 500)

    return polygon
}

function drawPolygonOnState() {
    console.log('drawPolygonOnState')

    var stateName = $('#state-select').val()
    $.get(urlBase + 'getState?state=' + stateName, function (data, textStatus, jqXHR) {
        console.log('Gotten state', stateName)
        window.state = data

        // console.log(state)

        bounds = getBounds(state)
        map.fitBounds(bounds)

        drawPolygonOnLocation(state, stateName, teal)
    })
}

function fetchPopulationData() {
    var statePop = 8252400
    var lgaPop = 404563
    var sPop = 15400

    setPopulation(statePop, lgaPop, sPop)
}

function setDistanceFromInModal() {
    $('#distance-from').text('Distance from ' + getSettlementName() + ', ' + getLGAName() + ', ' + getStateName() + ' State')
}

function initMap() {
    console.log('initMap')

    // return

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: Kaduna.location,
        mapTypeId: 'hybrid', // roadmap, satellite, hybrid, terrain
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_LEFT
        },
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER
        },
        scaleControl: true,
        streetViewControl: false,
        streetViewControlOptions: {
            position: google.maps.ControlPosition.LEFT_TOP
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: google.maps.ControlPosition.LEFT_TOP
        }
    });

    drawPolygonOnState()
}

function reduceZoom() {
    console.log('reduceZoom')

    var zoom = map.getZoom()
    map.setZoom(zoom - 0.5)
}

function adjustMap() {
    console.log('adjustMap')

    map.panBy(180, 0)
    reduceZoom()
}