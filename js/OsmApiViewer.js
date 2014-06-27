
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

		this.map.setView([47.365, 0.633], 10);

	}

	// Constructor, here ...

	this.mapCreate();

}
