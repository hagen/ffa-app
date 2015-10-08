jQuery.sap.declare("com.ffa.hpc.view.auth.Login");

// Provides controller view.Login
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/auth/LoginController"],
  function(jQuery, Controller) {
    "use strict";

    var Login = Controller.extend("com.ffa.hpc.view.auth.Login", /** @lends com.ffa.hpc.view.auth.Login.prototype */ {

    });

    /**
     * On init handler
     */
    Login.prototype.onInit = function() {
      this.getRouter().getRoute("login").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     * On exit handler
     */
    Login.prototype.onExit = function() {};

    /**
     * On before rendering; add in our 'New region' tile
     * at the beginning of the tile container
     */
    Login.prototype.onBeforeRendering = function() {};

    /**
     * On after rendering - the DOM is now built. Add in our 'New region' tile
     * at the beginning of the tile container
     */
    Login.prototype.onAfterRendering = function() {
      //jQuery.sap.require("com.ffa.hpc.thirdparty.spiders.Spiders");
    };

    /**
     * Route matched handler...
     * Currently, this only serves to swap between the two tabs of the login
     * page - sign in and register.
     */
    Login.prototype._onRouteMatched = function(oEvent) {
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
    Login.prototype.onTabSelect = function(oEvent) {
      // Now we can nav to the detail page.
      this.getRouter().navTo("login", {
        tab: oEvent.getParameter("selectedKey")
      }, !sap.ui.Device.system.phone);
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
     * Register tab, email notification/checking. This is used as a proxy
     * to remind the user thay they must supply a valid email address. It will
     * also validate the email address.
     */
    Login.prototype.onRegisterEmailChange = function(oEvent) {
      var oInput = oEvent.getSource();
      this.validateEmail(oInput);
    };

    /**
     * Register button. Wait a second, someone wants to register?!?! Yippee!!!
     * @param  {object} oEvent button event
     */
    Login.prototype.onRegisterButtonPress = function(oEvent) {

      // Validate the user-entered conditions
      var oEmailInput = this.getView().byId("idRegisterEmail");
      var oPasswordInput = this.getView().byId("idRegisterPassword");

      // Email validation...
      if (!(this.validateEmail(oEmailInput, true /* bTestExists */ ) && this._validatePassword(oPasswordInput))) {
        return;
      }

      // Name validation
      var oFirstnameInput = this.getView().byId("idFirstNameInput");
      var oLastnameInput = this.getView().byId("idLastNameInput");

      if (!(this._isNotEmpty(oFirstnameInput, "I'm not a fan of my name either, but we'll need yours") && this._isNotEmpty(oLastnameInput, "Derp. We'll need your last name. Formalities, you know..."))) {

      }

      // The rest of this code assumes you are not using a library.
      // It can be made less wordy if you use one.
      var oModel = this.getView().getModel("env");
      this._submitForm(oModel.getProperty("/host") + "/auth/local/register", "post", {
        email: oEmailInput.getValue(),
        password: oPasswordInput.getValue(),
        lastname: oLastnameInput.getValue(),
        firstname: oFirstnameInput.getValue()
      });
    };

    /**
     * Register tab, show password checkbox handling. Here we are either
     * changing the password field to Text or back to Password - up to the user.
     */
    Login.prototype.onShowPasswordCheckBoxSelect = function(oEvent) {
      // oEvent has a parameter - selected. Get it
      var bSelected = oEvent.getParameter("selected");

      // We'll also need the password field for the REGISTER form.
      var oInput = this.getView().byId("idRegisterPassword");
      if (oInput.getType() === sap.m.InputType.Password) {
        oInput.setType(sap.m.InputType.Text);
      } else {
        oInput.setType(sap.m.InputType.Password);
      }
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
     * Authenticate the user, by sending them to Google OAuth
     * @param  {[type]} oEvent [description]
     */
    Login.prototype.onGooglePress = function(oEvent) {
      var oModel = this.getView().getModel("env");
      window.location.href = oModel.getProperty("/host") + "/auth/google";
    };

    /**
     * Authenticate the user, by sending them to Google OAuth
     * @param  {[type]} oEvent [description]
     */
    Login.prototype.onTwitterPress = function(oEvent) {
      var oModel = this.getView().getModel("env");
      window.location.href = oModel.getProperty("/host") + "/auth/twitter";
    };

    /**
     * Authenticate the user, by sending them to Google OAuth
     * @param  {[type]} oEvent [description]
     */
    Login.prototype.onLinkedInPress = function(oEvent) {
      var oModel = this.getView().getModel("env");
      window.location.href = oModel.getProperty("/host") + "/auth/linkedin";
    };

    /**
     * Authenticate the user, by sending them to Google OAuth
     * @param  {[type]} oEvent [description]
     */
    Login.prototype.onSCNPress = function(oEvent) {
      var oModel = this.getView().getModel("env");
      window.location.href = oModel.getProperty("/host") + "/auth/scn";
    };

    /***
     *    ████████╗ ██████╗     ██████╗ ███████╗███╗   ███╗ ██████╗
     *    ╚══██╔══╝██╔═══██╗    ██╔══██╗██╔════╝████╗ ████║██╔═══██╗
     *       ██║   ██║   ██║    ██║  ██║█████╗  ██╔████╔██║██║   ██║
     *       ██║   ██║   ██║    ██║  ██║██╔══╝  ██║╚██╔╝██║██║   ██║
     *       ██║   ╚██████╔╝    ██████╔╝███████╗██║ ╚═╝ ██║╚██████╔╝
     *       ╚═╝    ╚═════╝     ╚═════╝ ╚══════╝╚═╝     ╚═╝ ╚═════╝
     *
     */

     /**
      * Handles the press event of the demo link, and navigates to the VR
      * headset specific demo page.
      * @param  {Event} oEvent Button press event
      */
    Login.prototype.onDemoLinkPress = function (oEvent) {
      // Navigate to the demo login screen... this is actually the screen
      // reserved for the VR app to login, but is also where the demo
      // account login can be found. Make sure the correct tab is set
      this.getRouter().navTo("demo", {
        tab : "demo"
      }, !sap.ui.Device.system.phone);
    };

    return Login;

  }, /* bExport= */ true);
