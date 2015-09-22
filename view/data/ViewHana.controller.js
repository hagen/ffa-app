jQuery.sap.declare("view.data.ViewHana");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Hana = Controller.extend("view.data.ViewHana", /** @lends view.data.ViewHana.prototype */ {

    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    Hana.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("view-hdb").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Hana.prototype.onExit = function() {};

    /**
     *
     */
    Hana.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Hana.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Hana.prototype._onRouteMatched = function(oEvent) {
      this._checkMetaDataLoaded("dataset");
      var oParameters = oEvent.getParameters();

      // The dataset ID may not have been provided. If not, that's cool
      if (oParameters.arguments.dataset_id) {
        // retain the data set id
        this._sId = oParameters.arguments.dataset_id;

        // raise an event for the master page to select the correct list item
        this.getEventBus().publish("Master", "SelectItem", { dataset_id : this._sId });

        // Bind the view to the data set Id
        var oPage = this.getView().byId("idHanaPage");

        // Bind the destination page with the path and expand params
        oPage.bindElement("dataset>/DataSets('" + this._sId + "')", {
          expand: "Dimensions,Hdb"
        });
      }
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
      * Start editing
      * @param  {Event} oEvent Button press event
      */
     Hana.prototype.onEditPress = function(oEvent) {

     };

    /**
     * Cancel editing
     * @param  {Event} oEvent Button event
     */
    Hana.prototype.onCancelPress = function(oEvent) {

    };


    return Hana;

  }, /* bExport= */ true);
