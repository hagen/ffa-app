jQuery.sap.declare("com.ffa.hpc.view.data.ViewImportIO");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/data/ViewController"],
  function(jQuery, Controller) {
    "use strict";

    var IO = Controller.extend("com.ffa.hpc.view.data.ViewImportIO", /** @lends com.ffa.hpc.view.data.ViewImportIO.prototype */ {

    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    IO.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("view-importio").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    IO.prototype.onExit = function() {};

    /**
     *
     */
    IO.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    IO.prototype.onAfterRendering = function() {};

    /***
     *    ███╗   ██╗ █████╗ ██╗   ██╗
     *    ████╗  ██║██╔══██╗██║   ██║
     *    ██╔██╗ ██║███████║██║   ██║
     *    ██║╚██╗██║██╔══██║╚██╗ ██╔╝
     *    ██║ ╚████║██║  ██║ ╚████╔╝
     *    ╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝
     *
     */

    /**
     * Route matched handler fires up the Wizard straight away
     */
    IO.prototype._onRouteMatched = function(oEvent) {
      this._checkMetaDataLoaded("dataset");
      var oParameters = oEvent.getParameters();

      // The dataset ID may not have been provided. If not, that's cool
      if (oParameters.arguments.dataset_id) {
        // retain the data set id
        this._sId = oParameters.arguments.dataset_id;

        // raise an event for the master page to select the correct list item
        this.getEventBus().publish("Master", "SelectItem", {
          dataset_id: this._sId
        });

        // Bind the view to the data set Id
        var oPage = this.getView().byId("idImportIOPage");

        // Bind the destination page with the path and expand params
        oPage.bindElement("dataset>/DataSets('" + this._sId + "')", {
          expand: "Dimensions,ImportIO"
        });
      }
    };

    /**
     * Nav back to the data set page, if we are on mobile
     * @param  {event} oEvent Button press event
     */
    IO.prototype.onNavBackPress = function(oEvent) {
      // nav back to the original route
      this.getRouter().navTo("datasets", {}, !sap.ui.Device.system.phone);
    };

    /***
     *    ██████╗ ██╗   ██╗████████╗████████╗ ██████╗ ███╗   ██╗███████╗
     *    ██╔══██╗██║   ██║╚══██╔══╝╚══██╔══╝██╔═══██╗████╗  ██║██╔════╝
     *    ██████╔╝██║   ██║   ██║      ██║   ██║   ██║██╔██╗ ██║███████╗
     *    ██╔══██╗██║   ██║   ██║      ██║   ██║   ██║██║╚██╗██║╚════██║
     *    ██████╔╝╚██████╔╝   ██║      ██║   ╚██████╔╝██║ ╚████║███████║
     *    ╚═════╝  ╚═════╝    ╚═╝      ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝
     *
     */

    /**
     * Nav to editing page
     * @param  {Event} oEvent Button press event
     */
    IO.prototype.onEditPress = function(oEvent) {

      this.getRouter().navTo("edit-importio", {
        dataset_id : this._sId
      }, !sap.ui.Device.system.phone);
    };

    return IO;

  }, /* bExport= */ true);
