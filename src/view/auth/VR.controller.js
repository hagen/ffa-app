jQuery.sap.declare("com.ffa.hpc.view.auth.VR");

// Provides controller view.VR
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/auth/LoginController"],
  function(jQuery, Controller) {
    "use strict";

    var VR = Controller.extend("com.ffa.hpc.view.auth.VR", /** @lends com.ffa.hpc.view.auth.VR.prototype */ {
    });

    /**
     * On init handler
     */
    VR.prototype.onInit = function() {
      this.getRouter().getRoute("vr").attachPatternMatched(this.onRouteMatched, this);
    };

    /**
     * On exit handler
     */
    VR.prototype.onExit = function() {};

    /**
     * On before rendering; add in our 'New region' tile
     * at the beginning of the tile container
     */
    VR.prototype.onBeforeRendering = function() {};

    /**
     * On after rendering - the DOM is now built. Add in our 'New region' tile
     * at the beginning of the tile container
     */
    VR.prototype.onAfterRendering = function() {
      //jQuery.sap.require("com.ffa.hpc.thirdparty.spiders.Spiders");
    };

    /**
     * Route matched handler...
     * Currently, this only serves to swap between the two tabs of the login
     * page - sign in and register.
     */
    VR.prototype.onRouteMatched = function(oEvent) {
      // When the route is matched, we either want the login tab or
      // the register tab
      var oParameters = oEvent.getParameters(),
        oView = this.getView(),
        eDiv = oView.byId("idDivLoginPanelWrapper"),
        oPanel = oView.byId("idLogOutPanel");

      // and tab... if tab is not set locally, set it; if parameter
      // is not supplied, and no local version, default.
      // Otherwise, leave the tab key alone
      if (!this._sTabKey) {
        this._sTabKey = oParameters.arguments.tab || "signin";
      } else if (oParameters.arguments.tab) {
        this._sTabKey = oParameters.arguments.tab;
      }

      // Note, that we may have been returned here from an unauthenticated request.
      // Therefore, we need to remember the hash from which we've come.
      this._maybeShowReason(oParameters.arguments.reason);

      // Lastly, we'll make sure the correct tab is selected. If it's not,
      // select it
      var oIconTabBar = this.getView().byId("idSignInIconTabBar");
      if (oIconTabBar.getSelectedKey() !== this._sTabKey) {
        oIconTabBar.setSelectedKey(this._sTabKey);
      }

      // Are we logged in? This determines which container is displayed to the user:
      // the log in, or log out container.
      this.checkLoggedIn(jQuery.proxy(function() {

        // hide the logged out panel
        oPanel.setVisible(true);
        eDiv.setVisible(false);
      }, this), jQuery.proxy(function() {

        // hide the logged out panel
        oPanel.setVisible(false);
        eDiv.setVisible(true);
      }, this));
    };

    /**
     * Handles selection of the tab
     * @param  {Event} oEvent Tab press event
     */
    VR.prototype.onTabSelect = function(oEvent) {
      // Now we can nav to the detail page.
      this.getRouter().navTo("vr", {
        tab: oEvent.getParameter("selectedKey")
      }, !sap.ui.Device.system.phone);
    };

    /***
     *    ███████╗ ██████╗  ██████╗██╗ █████╗ ██╗
     *    ██╔════╝██╔═══██╗██╔════╝██║██╔══██╗██║
     *    ███████╗██║   ██║██║     ██║███████║██║
     *    ╚════██║██║   ██║██║     ██║██╔══██║██║
     *    ███████║╚██████╔╝╚██████╗██║██║  ██║███████╗
     *    ╚══════╝ ╚═════╝  ╚═════╝╚═╝╚═╝  ╚═╝╚══════╝
     *
     */

    /**
     * Authenticate the user, by sending them to Google OAuth; if this is VR mode,
     * then these links will ONLY sign in - they will not also trigger registration.
     * @param  {[type]} oEvent [description]
     */
    VR.prototype.onGooglePress = function(oEvent) {
      var oModel = this.getView().getModel("env");
      window.location.href = oModel.getProperty("/host") + "/auth/google/strict";
    };

    /**
     * Authenticate the user, by sending them to Twitter OAuth; if this is VR mode,
     * then these links will ONLY sign in - they will not also trigger registration.
     * @param  {[type]} oEvent [description]
     */
    VR.prototype.onTwitterPress = function(oEvent) {
      var oModel = this.getView().getModel("env");
      window.location.href = oModel.getProperty("/host") + "/auth/twitter/strict";
    };

    /**
     * Authenticate the user, by sending them to LinkedIn OAuth; if this is VR mode,
     * then these links will ONLY sign in - they will not also trigger registration.
     * @param  {[type]} oEvent [description]
     */
    VR.prototype.onLinkedInPress = function(oEvent) {
      var oModel = this.getView().getModel("env");
      window.location.href = oModel.getProperty("/host") + "/auth/linkedin/strict";
    };

    /**
     * Authenticate the user, by sending them to Google OAuth; if this is VR mode,
     * then these links will ONLY sign in - they will not also trigger registration.
     * @param  {[type]} oEvent [description]
     */
    VR.prototype.onSCNPress = function(oEvent) {
      var oModel = this.getView().getModel("env");
      window.location.href = oModel.getProperty("/host") + "/auth/scn/strict";
    };

    /***
     *    ██████╗ ███████╗ ██████╗ ██╗███████╗████████╗███████╗██████╗
     *    ██╔══██╗██╔════╝██╔════╝ ██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗
     *    ██████╔╝█████╗  ██║  ███╗██║███████╗   ██║   █████╗  ██████╔╝
     *    ██╔══██╗██╔══╝  ██║   ██║██║╚════██║   ██║   ██╔══╝  ██╔══██╗
     *    ██║  ██║███████╗╚██████╔╝██║███████║   ██║   ███████╗██║  ██║
     *    ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
     *
     */

    /**
     * When fired, we are heading over to the registration page.
     * If this is a fixed demo mode execution, then this link will not work.
     * Instead, it will prompt the user to exit the VR app, and register
     * via the web app.
     * @param  {Event} oEvent Link press event
     */
    VR.prototype.onRegisterLinkPress = function(oEvent) {
      // Immediately show info alert, advising the user must register
      // when NOT in the VR app
      this.showInfoAlert(
        "It's so cool that you want to register! To do this, you'll have to create an account via. the web app. Head to hpc.forefrontanalytics.com.au, and select 'create an account'.",
        "App registration",
        sap.ui.Device.system.phone
      );
    };

    /***
     *    ██████╗ ███████╗███╗   ███╗ ██████╗
     *    ██╔══██╗██╔════╝████╗ ████║██╔═══██╗
     *    ██║  ██║█████╗  ██╔████╔██║██║   ██║
     *    ██║  ██║██╔══╝  ██║╚██╔╝██║██║   ██║
     *    ██████╔╝███████╗██║ ╚═╝ ██║╚██████╔╝
     *    ╚═════╝ ╚══════╝╚═╝     ╚═╝ ╚═════╝
     *
     */

    VR.prototype.onDemoButtonPress = function (oEvent) {
      // Demo button is pressed - we're logging in with a static demo account email
      // and password. These are in the env json file.
      var oModel = this.getView().getModel("env");

      // Function is in Root Login controller
      this.doLogin(oModel.getProperty("/demo_username"), oModel.getProperty("/demo_password"));
    };

    return VR;

  }, /* bExport= */ true);
