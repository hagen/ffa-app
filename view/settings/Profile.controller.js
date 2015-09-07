jQuery.sap.declare("view.settings.Profile");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "com/ffa/dash/util/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Profile = Controller.extend("view.settings.Profile", /** @lends view.settings.Profile.prototype */ {

    });

    /**
     *
     */
    Profile.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("profile").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Profile.prototype.onExit = function() {};

    /**
     *
     */
    Profile.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Profile.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Profile.prototype._onRouteMatched = function(oEvent) {
      // Make sure we have a meta data document
      this._checkMetaDataLoaded("profile");

      // Let the master list know I'm on this Folders view.
      this.getEventBus().publish("Profile", "RouteMatched", {} /* payload */ );

      // Bind this page to the Profile Id...
      let oPage = this.getView().byId("idProfilePage");
      oPage.bindElement("profile>/Profiles('TESTUSER')");
    };

    return Profile;

  }, /* bExport= */ true);
