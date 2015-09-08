jQuery.sap.declare("view.data.Wizard");
// Require the short Id gen library
jQuery.sap.require("thirdparty.shortid.ShortId");

// Provides controller view.Wizard
sap.ui.define(['jquery.sap.global', 'view/data/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Wizard = Controller.extend("view.data.Wizard", /** @lends view.data.Wizard.prototype */ {

    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    Wizard.prototype.onInit = function() {
      // Subscribe to busy calls
      this.getEventBus().subscribe("Busy", "Show", this.openBusyDialog, this);
      this.getEventBus().subscribe("Busy", "Update", this.updateBusyDialog, this);
      this.getEventBus().subscribe("Busy", "Close", this.closeBusyDialog, this);

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
      this._checkMetaDataLoaded("dataset");
    };

    /***
     *    ██╗  ██╗ █████╗ ███╗   ██╗ █████╗
     *    ██║  ██║██╔══██╗████╗  ██║██╔══██╗
     *    ███████║███████║██╔██╗ ██║███████║
     *    ██╔══██║██╔══██║██║╚██╗██║██╔══██║
     *    ██║  ██║██║  ██║██║ ╚████║██║  ██║
     *    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
     *
     */
    /**
     * User is configuring HANA cloud option
     * @param  {object} oEvent Button click event
     */
    Wizard.prototype.onHanaItemPress = function(oEvent) {
      // Create the fragment and open!
      this.getRouter().navTo("hana", {}, !sap.ui.Device.system.phone);
    };

    /***
     *    ██╗  ██╗ █████╗ ██████╗  ██████╗  ██████╗ ██████╗
     *    ██║  ██║██╔══██╗██╔══██╗██╔═══██╗██╔═══██╗██╔══██╗
     *    ███████║███████║██║  ██║██║   ██║██║   ██║██████╔╝
     *    ██╔══██║██╔══██║██║  ██║██║   ██║██║   ██║██╔═══╝
     *    ██║  ██║██║  ██║██████╔╝╚██████╔╝╚██████╔╝██║
     *    ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚═════╝ ╚═╝
     *
     */

    /**
     * User is configuring HDFS
     * @param  {object} oEvent Button click event
     */
    Wizard.prototype.onHadoopItemPress = function(oEvent) {
      // Coming soon.
      this._alertComingSoon();
    };

    /***
     *    ██████╗ ███████╗██████╗ ███████╗██╗  ██╗██╗███████╗████████╗
     *    ██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║██║██╔════╝╚══██╔══╝
     *    ██████╔╝█████╗  ██║  ██║███████╗███████║██║█████╗     ██║
     *    ██╔══██╗██╔══╝  ██║  ██║╚════██║██╔══██║██║██╔══╝     ██║
     *    ██║  ██║███████╗██████╔╝███████║██║  ██║██║██║        ██║
     *    ╚═╝  ╚═╝╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝
     *
     */

    /**
     * User is configuring AWS Redshift
     * @param  {object} oEvent Button click event
     */
    Wizard.prototype.onRedshiftItemPress = function(oEvent) {
      // Create the fragment and open!
      this.getRouter().navTo("redshift", {}, !sap.ui.Device.system.phone);
    };

    /***
     *     ██████╗  ██████╗  ██████╗  ██████╗ ██╗     ███████╗
     *    ██╔════╝ ██╔═══██╗██╔═══██╗██╔════╝ ██║     ██╔════╝
     *    ██║  ███╗██║   ██║██║   ██║██║  ███╗██║     █████╗
     *    ██║   ██║██║   ██║██║   ██║██║   ██║██║     ██╔══╝
     *    ╚██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝███████╗███████╗
     *     ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
     *
     */
    /**
     * User is configuring Google Sheets option
     * @param  {object} oEvent Button click event
     */
    Wizard.prototype.onSheetsItemPress = function(oEvent) {
      // Create the fragment and open!
      this.getRouter().navTo("sheets", {}, !sap.ui.Device.system.phone);
    };

    /***
     *     ██████╗███████╗██╗   ██╗
     *    ██╔════╝██╔════╝██║   ██║
     *    ██║     ███████╗██║   ██║
     *    ██║     ╚════██║╚██╗ ██╔╝
     *    ╚██████╗███████║ ╚████╔╝
     *     ╚═════╝╚══════╝  ╚═══╝
     *
     */
    /**
     * Handles the tile press for Csv data sources
     * @param  {object} oEvent Button/tile press event
     */
    Wizard.prototype.onCsvItemPress = function(oEvent) {
      // Coming soon.
      this._alertComingSoon();
    };

    // /**
    //  * When the user selects a CSV file for upload,
    //  * @param  {[type]} oEvent [description]
    //  * @return {[type]}        [description]
    //  */
    // Wizard.prototype.onCsvUploadChange = function(oEvent) {
    //   var oUploadCollection = oEvent.getSource();
    //
    //   // Header Token
    //   var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
    //     name: "x-csrf-token",
    //     value: this.getView().getModel("dataset").getSecurityToken()
    //   });
    //   oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
    //
    //   // Header Slug
    //   var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
    //     name: "slug",
    //     value: oEvent.getParameter("files")[0].name
    //   });
    //   oUploadCollection.addHeaderParameter(oCustomerHeaderSlug);
    //
    //   // Content-Type
    //   var oContentType = new sap.m.UploadCollectionParameter({
    //     name: "Content-Type",
    //     value: "multipart/form-data"
    //   });
    //   oUploadCollection.addHeaderParameter(oContentType);
    // };
    //
    // /**
    //  * User wishes to save the Google Sheets configuration...
    //  * @param  {object} oEvent Button press event
    //  */
    // Wizard.prototype.onCsvSavePress = function(oEvent) {
    //
    // };
    //
    // /**
    //  * User is cancelling the Google Sheets configuration process
    //  * @param  {object} oEvent Button press event
    //  */
    // Wizard.prototype.onCsvCancelPress = function(oEvent) {
    //   // close and destroy
    //   this._oCsvDialog.close();
    //   this.getView().removeDependent(this._oCsvDialog);
    //   this._oCsvDialog.destroy();
    //   delete this._oCsvDialog;
    // };

    /***
     *    ███████╗██╗  ██╗ ██████╗███████╗██╗
     *    ██╔════╝╚██╗██╔╝██╔════╝██╔════╝██║
     *    █████╗   ╚███╔╝ ██║     █████╗  ██║
     *    ██╔══╝   ██╔██╗ ██║     ██╔══╝  ██║
     *    ███████╗██╔╝ ██╗╚██████╗███████╗███████╗
     *    ╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝
     *
     */

    /**
     * Handles the tile press for Csv data sources
     * @param  {object} oEvent Button/tile press event
     */
    Wizard.prototype.onExcelItemPress = function(oEvent) {
      // Coming soon.
      this._alertComingSoon();
    };

    /**
     * Displays an alert with the supplied (optional) message
     * @param  {String} sMessage (optional) Message to display
     */
    Wizard.prototype._alertComingSoon = function (sMessage) {
      // If message is supplied, use it, otherwise, don't bother.
      this.showInfoAlert(sMessage || "Almost there. Sorry, this hasn't been implemented yet.", "Coming soon");
    };

    /**
     * Clears all inputs in the given dialog control
     * @param  {control} oDialog Dialog control
     */
    Wizard.prototype._clearDialog = function(aInputs) {
      jQuery.each(aInputs, function(i, c) {
        if (c instanceof sap.m.InputBase) {
          try {
            c.setValue("");
          } catch (e) {

          }
        }
      });
    };

    return Wizard;

  }, /* bExport= */ true);
