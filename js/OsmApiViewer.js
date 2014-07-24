/**
 * OsmApiViewer.js
 */

"use strict";

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
		var d = $(DlgMapEdit.dlgId);
		var title = (label === undefined ? d.data('title-new') : d.data('title'));
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

/**
 * Dialog box for Group edition
 */
var DlgGroupEdit = {

	dlgId : '#dlgGroupEdit',
	dlgCallback : null,

	showDialog : function(callback, id, label, desc) {
		DlgGroupEdit.dlgCallback = callback;
		var d = $(DlgGroupEdit.dlgId);
		var title = (id === undefined ? d.data('title-new') : d.data('title'));
		Helper.showDialog(title, DlgGroupEdit.dlgId, DlgGroupEdit.dialogCallback);
		var form = $('#formGroupEdit');
		$('#groupId', form).val(id);
		$('#groupLabel', form).val(label);
		$('#groupDescription', form).val(desc);
	},

	dialogCallback : function() {
		var form = $('#formGroupEdit');
		var id = $('#groupId', form).val().trim();
		var label = $('#groupLabel', form).val().trim();
		var desc = $('#groupDescription', form).val().trim();

		if (label.length == 0) {
			Helper.showDialogAlert('Le titre est obligatoire');
			return;
		}
		Helper.hideDialog();
		DlgGroupEdit.dlgCallback(id, label, desc);
	}
};

/**
 * Dialog box for Item edition
 */
var DlgItemEdit = {

	dlgId : '#dlgItemEdit',
	dlgCallback : null,

	showDialog : function(callback, id, label, desc, data) {
		DlgItemEdit.dlgCallback = callback ;
		var d = $(DlgItemEdit.dlgId);
		var title = (id === undefined ? d.data('title-new') : d.data('title'));
		Helper.showDialog(title, DlgItemEdit.dlgId, DlgItemEdit.dialogCallback);
		var form = $('#formItemEdit');
		$('#itemId', form).val(id);
		$('#itemLabel', form).val(label);
		$('#itemDescription', form).val(desc);
	},

	dialogCallback : function() {
		var form = $('#formItemEdit');
		var id = $('#itemId', form).val().trim();
		var label = $('#itemLabel', form).val().trim();
		var desc = $('#itemDescription', form).val().trim();

		if (label.length == 0) {
			Helper.showDialogAlert('Le titre est obligatoire');
			return;
		}
		Helper.hideDialog();
		DlgItemEdit.dlgCallback(id, label, desc);
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
			o.find('.label').text(label).data('description', desc);
			o.find('a.oav-groupEdit').click( function() {
				var o = $('#'+id).find('.label');
				DlgGroupEdit.showDialog(that.groupEditCallback, id, o.text(), o.data('description') );
			});
			o.find('a.oav-itemNew').click( function() {
				DlgItemEdit.showDialog(that.itemEditCallback);
			});

		} else {
			// Group edit
			var o = $('#'+id).find('.label');
			o.text(label).data('description', desc); 
		}
	};

	$('#groupNew').click(function() {
		DlgGroupEdit.showDialog(that.groupEditCallback);
	});

	// ==============
	// Item edit

	OsmApiViewer.prototype.itemEditCallback = function(id, label, desc) {
		
		log('itemEditCallback() id:' + id + ', label:' + label);

		if (id === undefined || id <= 0) {
			// New item
			var o = $('#tplItem').clone();
			var id = 'item-'+getUniqueId() ;
			o.attr('id', id).appendTo( $('> .tree > ul ', navTree) ).show();
			o.find('.label').text(label).data('description', desc);
			o.find('a.oav-itemEdit').click( function() {
				var o = $('#'+id).find('.label');
				DlgItemEdit.showDialog(that.itemEditCallback, id, o.text(), o.data('description') );
			});

		} else {
			// item edit
			var o = $('#'+id).find('.label');
			o.text(label).data('description', desc); 
		}

	};

	// ==============
	// Construtor actions

	var that = this;
	this.mapId = options.mapId;

	var navTree = $('#navTree');

	this.leafletMap = new OsmApiViewerMap(this.mapId);

	this.guiState();
	
	// ==================
	// Misc.

	var getUniqueId = function() {
		var d = new Date();
		return d.getMilliseconds() +'-'+getRandomInt(1000,9999) ;
	};

	var getRandomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	};

};
