jQuery.sap.declare("view.settings.Profile");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/NewDataSetController"],
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
      this._checkMetaDataLoaded("settings");

      // Let the master list know I'm on this Folders view.
      this.getEventBus().publish("Profile", "RouteMatched", {} /* payload */ );

      // Bind this page to the Profile Id...
      let oPage = this.getView().byId("idProfilePage");
      oPage.bindElement("settings>/Profiles('TESTUSER')");
    };

    /**
     * When a social icon tile is pressed, we are either linking, or unlinking
     * this profile from the account. This has to happen in Node.js and in HANA.
     * This can therefore take some time to perform. Eventually, we'll end up Back
     * here, so this controller's route handler has to recognise that scenario
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Profile.prototype.onSocialTilePress = function(oEvent) {
      let oTile = oEvent.getSource();
      let oContext = oTile.getBindingContext("settings");
      let sType = oContext.getProperty("type");

      // if this tile is linked, we are unlinking, and vice versa.
      if (oContext.getProperty("linked") === "X") {
        // unlink

        let fn = "_disconnect" + sType.charAt(0).toUpperCase() + sType.slice(1);
        if (typeof this[fn] === "function") {
          this[fn].apply(this, []);
        }
        // Set the tile to be NOT linked (refresh TC binding)
        oTile.getParent().getBinding("tiles").refresh();
      } else {
        // store link request Id
        let sLinkId = jQuery.sap.uid();
        window.localStorage.setItem("_link", sLinkId);

        // POST the link Id to back-end, including current bearer token.
        let oHeaders = {
          Authorization: 'Bearer ' + this.getBearerToken()
        };
        let sMessage = "";
        jQuery.ajax({
          url: '/auth/profile/link',
          type: 'POST',
          data : { link : sLinkId },
          headers: oHeaders,
          async: false,
          success: jQuery.proxy(function(oData, mResponse) {
            sMessage = oData.message;
          }, this),
          error: jQuery.proxy(function(mError) {
            this._maybeHandleAuthError(mError);
          }, this)
        })

        // link
        window.location.href = "/connect/" + sType;
      }
    };

    /***
     *    ██╗   ██╗███╗   ██╗██╗     ██╗███╗   ██╗██╗  ██╗██╗███╗   ██╗ ██████╗
     *    ██║   ██║████╗  ██║██║     ██║████╗  ██║██║ ██╔╝██║████╗  ██║██╔════╝
     *    ██║   ██║██╔██╗ ██║██║     ██║██╔██╗ ██║█████╔╝ ██║██╔██╗ ██║██║  ███╗
     *    ██║   ██║██║╚██╗██║██║     ██║██║╚██╗██║██╔═██╗ ██║██║╚██╗██║██║   ██║
     *    ╚██████╔╝██║ ╚████║███████╗██║██║ ╚████║██║  ██╗██║██║ ╚████║╚██████╔╝
     *     ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝
     *
     */

    /**
     * Sends a GET to Node to unlink the suppled account (path)
     * @param  {[type]} sPath [description]
     * @return {[type]}       [description]
     */
    Profile.prototype._unlinkNode = function(sPath) {
      let oHeaders = {
        Authorization: 'Bearer ' + _token
      }; /* Global var */
      let sMessage = "";
      jQuery.ajax({
        url: sPath,
        type: 'GET',
        headers: oHeaders,
        async: true,
        success: jQuery.proxy(function(oData, mResponse) {
          sMessage = oData.message;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this)
      })
    };

    /**
     * Send DELETE request to HANA to blank out social details
     * @param  {[type]} sPath [description]
     * @return {[type]}       [description]
     */
    Profile.prototype._delimitHana = function(sPath) {
      this.getView().getModel("settings").remove(sPath, {
        success: jQuery.proxy(function(oData, mResponse) {
          let sMessage = 1;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this)
      });
    };

    /**
     * Call Node and unlink. Then call HANA and unlink.
     * @return {[type]} [description]
     */
    Profile.prototype._disconnectGoogle = function() {
      // unlink node js version
      this._unlinkNode("/disconnect/google");
      // And now HANA
      this._delimitHana("/GoogleProfiles('TESTUSER')");
    };

    /**
     * Call Node and unlink. Then call HANA and unlink.
     * @return {[type]} [description]
     */
    Profile.prototype._disconnectTwitter = function() {
      // unlink node js version
      this._unlinkNode("/disconnect/twitter");
      // And now HANA
      this._delimitHana("/TwitterProfiles('TESTUSER')");
    };

    /**
     * Call Node and unlink. Then call HANA and unlink.
     * @return {[type]} [description]
     */
    Profile.prototype._disconnectLinkedin = function() {
      // unlink node js version
      this._unlinkNode("/disconnect/linkedin");
      // And now HANA
      this._delimitHana("/LinkedInProfiles('TESTUSER')");
    };

    return Profile;

  }, /* bExport= */ true);
