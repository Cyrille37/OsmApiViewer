/**
 * OsmApiViewerMap.js
 */

function OsmApiViewerMap( mapId, options) {

	OsmApiViewerMap.DEFAULTS = {
			location: [47.39251,0.68698],
			zoom: 18
	};

	var that = this ;
	
	this.options = $.extend({}, OsmApiViewerMap.DEFAULTS, typeof options == 'object' && option);
	this.mapId = mapId ;
	this.map = L.map( mapId );

	var OsmDataAttr = 'Data © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
	var osmFr = new L.TileLayer(
		'http://{s}.tile.openstreetmap.fr/{type}/{z}/{x}/{y}.png', {
		minZoom: 1, 
		maxZoom: 20, 
		type: 'osmfr',
		attribution: OsmDataAttr+', Map by &copy; <a href="http://openstreetmap.fr">OSM_Fr</a>'
	});
	this.map.addLayer(osmFr);

	this.map.setView(this.options.location, this.options.zoom);
	
	$(window).on('resize', function() {
	    $('#'+that.mapId).height($(window).height());
	    //.width($(window).width());
	    that.map.invalidateSize();

	}).trigger('resize');

};
