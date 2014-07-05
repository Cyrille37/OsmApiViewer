/**
 * OsmApiViewer.js
 */

/**
 */
function log(msg)
{
	window.console && console.log(msg);
}
function logo(obj)
{
	window.console && console.dir(obj);
}

/**
 * IHM initialization
 */
$(function() {

	// Plier/déplier les catégories
	$('.tree').find('li:has(ul)').find(' > span').attr('title', 'Replier la catégorie').on('click', function (e) {
		var children = $(this).parent('li').find(' > ul > li');
		if (children.is(':visible')) {
			children.hide('fast');
			$(this).attr('title', 'Déplier la catégorie').find(' > i')
				.addClass('glyphicon-folder-close').removeClass('glyphicon-folder-open');
		}
		else {
			children.show('fast');
			$(this).attr('title', 'Replier la catégorie').find(' > i')
				.addClass('glyphicon-folder-open').removeClass('glyphicon-folder-close');
		}
		e.stopPropagation();
	});

	// Sélectionner/désélectionner les données
	$('.tree').find('li:has(ul)').find(' > ul > li').attr('title', 'Sélectionner ces données').on('click', function (e) {
		if( $(this).attr('selected') )
		{
			$(this).attr('selected',null).find('i')
				.addClass('glyphicon-ok-circle').removeClass('glyphicon-ok-sign');
		}
		else
		{
			//log( 'data-queryType: '+$(this).attr('data-queryType'));
			//log( 'data-query: '+$(this).attr('data-query'));

			$(this).attr('selected','1').find('i')
				.addClass('glyphicon-ok-sign').removeClass('glyphicon-ok-circle');
			
			oav.query($(this).attr('data-queryType'),$(this).attr('data-query'));
		}
	});

});

/**
 * OsmApiViewer
 */
function OsmApiViewer ( options ) {

	this.mapId = options.mapId ;

	// used in event context
	var self = this;

	this.mapCreate = function ()
	{
		this.map = L.map( this.mapId );

		var OsmDataAttr = 'Data © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
		var osmFr = new L.TileLayer(
			'http://{s}.tile.openstreetmap.fr/{type}/{z}/{x}/{y}.png', {
			minZoom: 1, 
			maxZoom: 20, 
			type: 'osmfr',
			attribution: OsmDataAttr+', Map by &copy; <a href="http://openstreetmap.fr">OSM_Fr</a>'
		});
		this.map.addLayer(osmFr);

		this.map.setView([47.39251, 0.68698], 19);

	}

	// Constructor, here ...

	this.mapCreate();

	/**
	 * Event occured after drag or zoom
	 */
	this.map.on('moveend', function(e) {
		//console.log('map moveend');
	});

	this.query = function(queryType,query)
	{
		log('query(): '+queryType+', '+query);
		var b = this.map.getBounds();
		//logo( b );
		var bb = b.getWest()+','+b.getSouth()+','+b.getEast()+','+b.getNorth() ;
		url = 'proxy.php?'
			+'qt='+encodeURIComponent(queryType)
			+'&q='+encodeURIComponent(query)
			+'&bb='+bb ;
		var jqxhr = $.ajax(
		{
			url: url,
			type: 'GET',
			dataType: 'xml'
		})
		.done(function(data, statusStr, jqXHR) {
			log('ajax done');
			log(statusStr);
			log('data: '+data);
			geojson = osmtogeojson(data);
			log('geojson: '+geojson);

			var geoJsonLayer = L.geoJson(geojson, {
				style: function (feature) {
					return {color: feature.properties.color};
				},
				onEachFeature: function (feature, layer) {
					layer.bindPopup(feature.properties.description);
				}
			}); //.addTo(self.map);
			
			var markers = new L.MarkerClusterGroup();
			markers.addLayer(geoJsonLayer);
			self.map.addLayer(markers);

		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			log('ajax fail');
		})
		.always(function(data_jqXHR, textStatus, jqXHR_errorThrown) {
			log('ajax always');
		});


	}

}
