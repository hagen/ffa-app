jQuery.sap.declare("com.ffa.hpc.view.datasets.ViewHDB");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/datasets/ViewController"],
  function(jQuery, Controller) {
    "use strict";

    var HDB = Controller.extend("com.ffa.hpc.view.datasets.ViewHDB", /** @lends com.ffa.hpc.view.datasets.ViewHDB.prototype */ {
      _editMode: false
    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    HDB.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("view-hdb").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    HDB.prototype.onExit = function() {};

    /**
     *
     */
    HDB.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    HDB.prototype.onAfterRendering = function() {};

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
    HDB.prototype._onRouteMatched = function(oEvent) {
      this.checkMetaDataLoaded("dataset");
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
        var oPage = this.getView().byId("idHDBPage");

        // Bind the destination page with the path and expand params
        oPage.bindElement("dataset>/DataSets('" + this._sId + "')", {
          expand: "Dimensions,Hdb"
        });
      }
    };

    /**
     * Nav back to the data set page, if we are on mobile
     * @param  {event} oEvent Button press event
     */
    HDB.prototype.onNavBackPress = function(oEvent) {
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
    HDB.prototype.onEditPress = function(oEvent) {

      this.getRouter().navTo("edit-hdb", {
        dataset_id: this._sId
      }, !sap.ui.Device.system.phone);
    };

    return HDB;

  }, /* bExport= */ true);
