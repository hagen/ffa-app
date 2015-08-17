jQuery.sap.declare("view.data.Wizard");
// Require the short Id gen library
jQuery.sap.require("thirdparty.shortid.ShortId");

// Provides controller view.Wizard
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var Wizard = Controller.extend("view.data.Wizard", /** @lends view.data.Wizard.prototype */ {

	});

	/**
	 * On init handler. We are setting up the route matched handler, because
	 * it is possible to navigate directly to this page.
	 */
	Wizard.prototype.onInit = function() {
    // handle route matched
    this.getRouter().getRoute("new-dataset").attachPatternMatched(this._onRouteMatched, this);
  };

	/**
	 *
	 */
	Wizard.prototype.onExit = function() {};

	/**
	 *
	 */
	Wizard.prototype.onBeforeRendering = function() {};

	/**
	 *
	 */
	Wizard.prototype.onAfterRendering = function() {};

  /**
	 * Route matched handler fires up the Wizard straight away
	 */
	Wizard.prototype._onRouteMatched = function(oEvent) {

	};

	/**
	_    _          _   _             _____ _                 _
| |  | |   /\   | \ | |   /\      / ____| |               | |
| |__| |  /  \  |  \| |  /  \    | |    | | ___  _   _  __| |
|  __  | / /\ \ | . ` | / /\ \   | |    | |/ _ \| | | |/ _` |
| |  | |/ ____ \| |\  |/ ____ \  | |____| | (_) | |_| | (_| |
|_|  |_/_/    \_\_| \_/_/    \_\  \_____|_|\___/ \__,_|\__,_|

	 */
  /**
   * User is configuring HANA cloud option
   * @param  {object} oEvent Button click event
   */
  Wizard.prototype.onHanaCloudPress = function(oEvent) {
    // Create the fragment and open!
    if(!this._oHanaCloudDialog) {
      this._oHanaCloudDialog = sap.ui.xmlfragment("idHanaCloudDialog", "view.data.HanaCloudDialog", this);
      this.getView().addDependent(this._oHanaCloudDialog);
    }

    // now show the dialog
    this._oHanaCloudDialog.open();
  };

  /**
   * User wishes to save the Hana Cloud configuration...
   * @param  {object} oEvent Button press event
   */
  Wizard.prototype.onHanaCloudSavePress = function(oEvent) {
    // close and destroy
    this.onHanaCloudCancelPress(null);
  };

  /**
   * User is cancelling the Hana Cloud configuration process
   * @param  {object} oEvent Button press event
   */
  Wizard.prototype.onHanaCloudCancelPress = function(oEvent) {
    // close and destroy
    this._oHanaCloudDialog.close();
    this.getView().removeDependent(this._oHanaCloudDialog);
    this._oHanaCloudDialog.destroy();
    delete this._oHanaCloudDialog;
  };

/**
 	  _____                   _
  / ____|                 | |
 | |  __  ___   ___   __ _| | ___
 | | |_ |/ _ \ / _ \ / _` | |/ _ \
 | |__| | (_) | (_) | (_| | |  __/
  \_____|\___/ \___/ \__, |_|\___|
                      __/ |
                     |___/
*/
  /**
   * User is configuring Google Sheets option
   * @param  {object} oEvent Button click event
   */
  Wizard.prototype.onGoogleSheetsPress = function(oEvent) {
    // Create the fragment and open!
    if(!this._oGoogleSheetsDialog) {
      this._oGoogleSheetsDialog = sap.ui.xmlfragment("idGoogleSheetsDialogFragment", "view.data.GoogleSheetsDialog", this);
      this.getView().addDependent(this._oGoogleSheetsDialog);
    }

    // now show the dialog
    this._oGoogleSheetsDialog.open();
  };

	/**
	 * When the help icon is pressed, show help :)
	 * @param  {object} oEvent Icon press event
	 */
	Wizard.prototype.onGoogleSheetsHelpIconPress = function(oEvent) {
		alert("Help");
	};

  /**
   * User wishes to save the Google Sheets configuration...
   * @param  {object} oEvent Button press event
   */
  Wizard.prototype.onGoogleSheetsSavePress = function(oEvent) {
		// We'll need this for closures
		var that = this;

		// set screen to busy
	 this.openBusyDialog({
			title: "Loading",
			text: "Retrieving you spread sheet - one moment please..."
		});

		jQuery.sap.delayedCall(1000, this, function(){

			// New Id
			var sId = ShortId.generate(10);

			// Collect the key we're to use
			var oData = {
				id: sId,
				key: sap.ui.core.Fragment.byId("idGoogleSheetsDialogFragment", "idGoogleSheetsKey").getValue(),
				// BIG note here: the title supplied here is not used against the google dataset specifically,
				// this value will be used for the dataset name; The title field is reserved for the Google Sheets
				// document name, which will be populated on the server
				title: sap.ui.core.Fragment.byId("idGoogleSheetsDialogFragment", "idGoogleSheetsName").getValue(),
				headers: (sap.ui.core.Fragment.byId("idGoogleSheetsDialogFragment", "idGoogleSheetsHeadersCheckbox").getSelected() ? "X" : " " )
			};
			var oModel = that.getView().getModel("dataset");

			// save Google Sheets data source
			oModel.create("/GoogleSheets", oData, {
				success: function(oData, mResponse) {
					// Refresh the dataset listing by raising an event (subscribers will do
					// the work)
					that.getEventBus().publish("Detail", "RefreshMaster", {});

					// Update the screen, then close.
					that.updateBusyDialog({
						text: "All done! Finishing up..."
					});

					// Timed close.
					jQuery.sap.delayedCall(1500, that, function() {
						that.closeBusyDialog();
						that.onGoogleSheetsCancelPress(null);

						// Navigate to the new data set...
						that.getRouter().navTo("datasets", {
							dataset_id : sId
						}, !sap.ui.Device.system.phone);
					});
				},
				error : function(mError) {
					alert("Error");
				},
				async : true
			});
		});
  };

  /**
   * User is cancelling the Google Sheets configuration process
   * @param  {object} oEvent Button press event
   */
  Wizard.prototype.onGoogleSheetsCancelPress = function(oEvent) {
    // close and destroy
    this._oGoogleSheetsDialog.close();
    this.getView().removeDependent(this._oGoogleSheetsDialog);
    this._oGoogleSheetsDialog.destroy();
    delete this._oGoogleSheetsDialog;
  };

	/**
	   _____  _______      __
	 / ____|/ ____\ \    / /
	| |    | (___  \ \  / /
	| |     \___ \  \ \/ /
	| |____ ____) |  \  /
	\_____|_____/    \/
	 */
	/**
	 * Handles the tile press for Csv data sources
	 * @param  {object} oEvent Button/tile press event
	 */
	Wizard.prototype.onCsvPress = function(oEvent) {
			// Create the fragment and open!
			if(!this._oCsvDialog) {
				this._oCsvDialog = sap.ui.xmlfragment("idCsvDialogFragment", "view.data.CsvDialog", this);
				this.getView().addDependent(this._oCsvDialog);
			}

			// now show the dialog
			this._oCsvDialog.open();
	};

	/**
	 * When the user selects a CSV file for upload,
	 * @param  {[type]} oEvent [description]
	 * @return {[type]}        [description]
	 */
	Wizard.prototype.onCsvUploadChange = function(oEvent) {
    var oUploadCollection = oEvent.getSource();

    // Header Token
    var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
      name : "x-csrf-token",
      value : this.getView().getModel("dataset").getSecurityToken()
    });
		oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

    // Header Slug
    var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
      name : "slug",
      value : oEvent.getParameter("files")[0].name
    });
		oUploadCollection.addHeaderParameter(oCustomerHeaderSlug);

		// Content-Type
		var oContentType = new sap.m.UploadCollectionParameter({
			name : "Content-Type",
			value : "multipart/form-data"
		});
		oUploadCollection.addHeaderParameter(oContentType);
  };

	/**
   * User wishes to save the Google Sheets configuration...
   * @param  {object} oEvent Button press event
   */
  Wizard.prototype.onCsvSavePress = function(oEvent) {

  };

  /**
   * User is cancelling the Google Sheets configuration process
   * @param  {object} oEvent Button press event
   */
  Wizard.prototype.onCsvCancelPress = function(oEvent) {
    // close and destroy
    this._oCsvDialog.close();
    this.getView().removeDependent(this._oCsvDialog);
    this._oCsvDialog.destroy();
    delete this._oCsvDialog;
  };

	/**
	 * Opens a busy dialog WITH title and text
	 * @param  {object} oParams Object of parameters
	 */
	Wizard.prototype.openBusyDialog = function(oParams) {
		// Create the fragment and open!
		if(!this._oBusyDialog) {
			this._oBusyDialog = sap.ui.xmlfragment("idDataSetBusyDialogFragment", "view.data.BusyDialog", this);
			this.getView().addDependent(this._oBusyDialog);
		}

		// Set title, text and cancel event
		this._oBusyDialog.setTitle(oParams.title);
		this._oBusyDialog.setText(oParams.text);
		if(typeof oParams.onClose !== 'undefined') {
				this._oBusyDialog.onClose(oParams.onClose);
		}

		// now show the dialog
		this._oBusyDialog.open();
	};

	/**
	 * Updates the open busy dialog with new text.
	 * @param  {object} oParams Params containing only text
	 */
	Wizard.prototype.updateBusyDialog = function(oParams) {
		this._oBusyDialog.setText(oParams.text);
	};

	/**
	 * Closes the busy dialog
	 */
	Wizard.prototype.closeBusyDialog = function() {
		if(this._oBusyDialog) {
			// now show the dialog
			this._oBusyDialog.close();
		}
	};

	return Wizard;

}, /* bExport= */ true);
