/**
 * OsmApiViewer.js
 */

/**
 */
function log(msg) {
	window.console && console.log(msg);
}
function logo(obj) {
	window.console && console.dir(obj);
}

var Helper = {

	dlgId : '#dlgModal',

	showDialog : function(title, dlgContentId, callback) {

		$(Helper.dlgId).on('show.bs.modal', function(e) {
			$(Helper.dlgId).off('show.bs.modal');
			$('.alert', this).hide();
		});

		var d = $(Helper.dlgId).modal({
			backdrop : 'static'
		});
		d.find('.modal-title').text(title);
		d.find('.modal-body').html($(dlgContentId).html());
		d.find('#dlgModalOk').click(callback);
	},

	showDialogAlert : function(message) {
		$(Helper.dlgId + ' .alert').text(message).show();
	},

	hideDialog : function() {
		$(Helper.dlgId).find('#dlgModalOk').off('click');
		$(Helper.dlgId).modal('hide');
	}
};

var DlgConfirm = {

	dlgId : '#dlgConfirm',
	dlgCallback : null,

	showDialog : function(title, message, callback) {
		DlgConfirm.dlgCallback = callback;
		$(DlgConfirm.dlgId + ' .alert').text(message);
		Helper.showDialog(title, DlgConfirm.dlgId, DlgConfirm.dialogCallback);
	},

	dialogCallback : function() {
		$(Helper.dlgId).on('hidden.bs.modal', function(e) {
			$(Helper.dlgId).off('hidden.bs.modal');

			DlgConfirm.dlgCallback(true);
		});
		Helper.hideDialog();
	}
};

var DlgMapEdit = {

	dlgId : '#dlgMapEdit',
	dlgCallback : null,

	showDialog : function(callback, label, desc) {
		DlgMapEdit.dlgCallback = callback;
		var title = (label === undefined ? 'Créer une carte'
				: 'Éditer la carte');
		Helper.showDialog(title, DlgMapEdit.dlgId, DlgMapEdit.dialogCallback);
		var formMapEdit = $('#formMapEdit');
		$('#mapLabel', formMapEdit).val(label);
		$('#mapDescription', formMapEdit).val(desc);
	},

	dialogCallback : function() {
		var formMapEdit = $('#formMapEdit');
		var label = $('#mapLabel', formMapEdit).val().trim();
		var desc = $('#mapDescription', formMapEdit).val().trim();

		if (label.length == 0) {
			Helper.showDialogAlert('Le titre est obligatoire');
			return;
		}
		Helper.hideDialog();
		DlgMapEdit.dlgCallback(label, desc);
	}
};

var DlgGroupEdit = {

	dlgId : '#dlgGroupEdit',
	dlgCallback : null,

	showDialog : function(callback, id, label, desc) {
		DlgGroupEdit.dlgCallback = callback;
		var title = (id === undefined ? 'Créer un groupe' : 'Éditer le groupe');
		Helper.showDialog(title, DlgGroupEdit.dlgId,
				DlgGroupEdit.dialogCallback);
		var formGroupEdit = $('#formGroupEdit');
		$('#groupId', formGroupEdit).val(id);
		$('#groupLabel', formGroupEdit).val(label);
		$('#groupDescription', formGroupEdit).val(desc);
	},

	dialogCallback : function() {
		var formGroupEdit = $('#formGroupEdit');
		var id = $('#groupId', formGroupEdit).val().trim();
		var label = $('#groupLabel', formGroupEdit).val().trim();
		var desc = $('#groupDescription', formGroupEdit).val().trim();

		if (label.length == 0) {
			Helper.showDialogAlert('Le titre est obligatoire');
			return;
		}
		Helper.hideDialog();
		DlgGroupEdit.dlgCallback(id, label, desc);
	}
};

/**
 * OsmApiViewer
 */
function OsmApiViewer(options) {

	/**
	 * 
	 */
	OsmApiViewer.prototype.guiState = function() {

		var navBar = $('#navBar');

		$('[data-toggle="tooltip"]', navBar).tooltip();

		$('#mapNew', navBar).removeClass('disabled');
		$('#mapUpload', navBar).removeClass('disabled');

		if (this.hasMap()) {
			// Map editing
			$('#navTree').show();
			if (this.isMapDirty()) {
				$('#mapSave', navBar).removeClass('disabled');
			} else {
				$('#mapSave', navBar).addClass('disabled');
			}
			$('#mapDelete', navBar).removeClass('disabled');
			$('#mapDownload', navBar).removeClass('disabled');

		} else {
			// No map edited

			$('#navTree').hide();
			$('#mapSave', navBar).addClass('disabled');
			$('#mapDelete', navBar).addClass('disabled');
			$('#mapDownload', navBar).addClass('disabled');

		}
	};

	OsmApiViewer.prototype.hasMap = function() {

		if (navTree.data('label') === undefined)
			return false;
		return true;
	};

	OsmApiViewer.prototype.isMapDirty = function() {
		return navTree.data('dirty');
	};

	OsmApiViewer.prototype.setMapDirty = function() {
		navTree.data('dirty', true);
	};

	// ==============
	// Map edit

	/**
	 * 
	 */
	OsmApiViewer.prototype.mapNew = function(e) {

		if (that.isMapDirty() && e !== true) {
			DlgConfirm
					.showDialog(
							'Confirmez:',
							'Vos modifications ne sont pas enregistrées, si vous créez une nouvelle carte elles seront perdues.',
							that.mapNew);
		} else {
			DlgMapEdit.showDialog(that.mapNewCallback);
		}
	};

	OsmApiViewer.prototype.mapNewCallback = function(label, desc) {
		that.setMapLabel(label);
		that.setMapDescription(desc);
		that.guiState();
	};

	OsmApiViewer.prototype.getMapLabel = function() {
		return navTree.data('label');
	};

	OsmApiViewer.prototype.setMapLabel = function(label) {
		navTree.data('label', label);
		this.setMapDirty();
		$('.header span', navTree).text(label);
	};

	OsmApiViewer.prototype.getMapDescription = function() {
		return navTree.data('description');
	};

	OsmApiViewer.prototype.setMapDescription = function(desc) {
		navTree.data('description', desc);
		this.setMapDirty();
	};

	$('#mapNew', navBar).click(this.mapNew);
	$('#mapEdit').click(
			function() {
				DlgMapEdit.showDialog(that.mapNewCallback, that.getMapLabel(),
						that.getMapDescription());
			});

	// ==============
	// Group edit

	/**
	 * 
	 */
	OsmApiViewer.prototype.groupEditCallback = function(id, label, desc) {

		log('groupEditCallback() id:' + id + ', label:' + label);

		if (id === undefined || id <= 0) {
			// New group
			var o = $('#tplGroup').clone();
			var id = 'group-'+getUniqueId() ;
			o.attr('id', id).appendTo( $('> .tree > ul ', navTree) ).show();
			o.find('.groupLabel').text(label).data('description', desc);
			o.find('a.oav-groupEdit').click( function() {
				var o = $('#'+id).find('.groupLabel');
				DlgGroupEdit.showDialog(that.groupEditCallback, id, o.text(), o.data('description') );
			});

		} else {
			// Group edit
			var o = $('#'+id).find('.groupLabel');
			o.text(label).data('description', desc); 
		}
	};

	$('#groupNew').click(function() {
		DlgGroupEdit.showDialog(that.groupEditCallback);
	});

	// ==============
	// Construtor actions

	var that = this;
	this.mapId = options.mapId;

	var navTree = $('#navTree');

	this.leafletMap = new OsmApiViewerMap(this.mapId);

	this.guiState();
	
	// ==================
	// Misc.
	
	getUniqueId = function() {
		var d = new Date();
		return d.getMilliseconds() +'-'+getRandomInt(1000,9999) ;
	}
	getRandomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
};
