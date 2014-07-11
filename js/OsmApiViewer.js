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

	var categories = $('.tree').find('li:has(ul)');
	
	// Plier/déplier les catégories
	categories.find(' > span').attr('title', 'Replier la catégorie').on('click', function (e) {

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

	// Sélectionner/désélectionner les données et lancer la requête ou supprimer le layer de données
	categories.find(' > ul > li a.oav-dataselect').attr('title', 'Ajouter ces données').on('click', function (e) {

		var p = $(this).parent('li') ;

		if( p.hasClass('querying') == true )
			return ;

		if( p.attr('selected') )
		{
			p.attr('selected',null);
			$(this).attr('title', 'Ajouter ces données').find('i')
				.addClass('glyphicon-ok-circle').removeClass('glyphicon-ok-sign');
			// remove data layer
			oav.remove( p.attr('data-queryType'), p.attr('data-query') );
		}
		else
		{
			p.attr('selected',true).addClass('querying');
			$(this).attr('title', 'Supprimer ces données').find('i')
				.addClass('glyphicon-ok-sign').removeClass('glyphicon-ok-circle');

			// get data
			oav.query( p.attr('data-queryType'), p.attr('data-query'), p, 'querying' );

		}
	});

	// paramètres des données
	//categories.find(' > ul > li a.oav-datasettings').attr('title', 'Configurer ce jeu de données').on('click', function (e) {
	//});

});

/**
 * OsmApiViewer
 */
function OsmApiViewer ( options ) {

	this.mapId = options.mapId ;
	this.map = null ;
	this.queries = [] ;

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
	this.map.on('moveend', function(e)
	{
		console.log('map.on(moveend)');

		//var oo = $('.tree').find('li:has(ul)').find(' > ul > li');
		//.attr('selected')

		$.each($('.tree').find('li:has(ul)').find(' > ul > li'), function( i, o ) {
			var o = $(o);
			if( o.attr('selected') )
			{
				var qt = o.attr('data-queryType');
				var q = o.attr('data-query');
				log('got one selected');
				self.remove( qt, q );
				self.query( qt, q );
			}
		});

	});

	this.remove = function(queryType,query)
	{
		log('remove(): '+queryType+', '+query);
		var qid = md5(queryType+query);
		//logo( this.queries[qid] );
		if( self.queries[qid] == undefined )
			return ;

		if( self.queries[qid].markers != null )
		{
			//self.queries[qid].markers.removeLayer(self.queries[qid].geoJsonLayer);
			self.queries[qid].markers.clearLayers();
			self.map.removeLayer(self.queries[qid].markers);
			self.queries[qid].markers = null ;
			self.queries[qid].geoJsonLayer = null ;
		}
	}

	this.query = function( queryType, query, ihmObject, ihmClass2Remove )
	{
		log('query(): '+queryType+', '+query);

		var qid = md5(queryType+query);
		if( this.queries[qid] != undefined )
		{
			if( this.queries[qid].querying )
			{
				log('already querying...');
				return ;
			}
		} else {
			this.queries[qid] = { 'qid': qid, 'queryType': queryType, 'query': query };
		}
		this.queries[qid].querying = true ;

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

			log('query.done(): '+queryType+', '+query);
			geojson = osmtogeojson(data);

			var geoJsonLayer = L.geoJson(geojson, {
				'style': function (feature) {
					//logo(feature);
					return {color: '#00FF00' /*feature.properties.color*/};
				},
				'onEachFeature': function (feature, layer) {
					layer.bindPopup(feature.properties.description);
				}
			}); //.addTo(self.map);

			if( self.queries[qid].markers != null )
			{
				self.remove(queryType,query);
			}

			var markers = new L.MarkerClusterGroup({

				'iconCreateFunction': function(cluster) {
					var childCount = cluster.getChildCount();
					var c = ' marker-cluster-';
					if (childCount < 10) {
						c += 'small';
					} else if (childCount < 100) {
						c += 'medium';
					} else {
						c += 'large';
					}
					return new L.DivIcon({
						html: '<div><span>' + childCount + '</span></div>',
						className: 'marker-cluster' + c,
						iconSize: new L.Point(40, 40) });
				}

			});

			markers.addLayer(geoJsonLayer);
			self.map.addLayer(markers);

			self.queries[qid].markers = markers ;
			self.queries[qid].geoJsonLayer = geoJsonLayer ;

		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			log('query.fail(): '+queryType+', '+query);
		})
		.always(function(data_jqXHR, textStatus, jqXHR_errorThrown) {
			log('query.always(): '+queryType+', '+query);
			self.queries[qid].querying = false ;
			if( ihmObject != undefined )
				ihmObject.removeClass( ihmClass2Remove );
		});

	}

}
