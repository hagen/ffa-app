jQuery.sap.declare("view.auth.Login");

// Provides controller view.Login
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Login = Controller.extend("view.auth.Login", /** @lends view.auth.Login.prototype */ {

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
      jQuery.sap.require("thirdparty.spiders.Spiders");
    };

    /**
     * Route matched handler...
     * Currently, this only serves to swap between the two tabs of the login
     * page - sign in and register.
     */
    Login.prototype._onRouteMatched = function(oEvent) {
      // When the route is matched, we either want the login tab or
      // the register tab
      var oParameters = oEvent.getParameters();

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
    };

    /**
     * Tab bar handling
     */
    Login.prototype.onTabSelect = function(oEvent) {
      // Now we can nav to the detail page.
      this.getRouter().navTo("login", {
        tab: oEvent.getParameter("selectedKey")
      }, !sap.ui.Device.system.phone);
    };

    /**
     * Register tab, email notification/checking. This is used as a proxy
     * to remind the user thay they must supply a valid email address. It will
     * also validate the email address.
     */
    Login.prototype.onRegisterEmailChange = function(oEvent) {
      var oInput = oEvent.getSource();
      var sEmail = oEvent.getParameter("value");
      var sState = sap.ui.core.ValueState.Warning;

      // TODO Localisation
      var sText = "An account activation e-mail will be sent to this email";

      // Email validation...
      var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
      if (!re.test(sEmail)) {
        sState = sap.ui.core.ValueState.Error;
        // TODO Localisation
        sText = "Yikes! This e-mail appears to be invalid!";
      }

      // Update input, to either show a reminder, or... show an error
      oInput.setValueState(sState);
      oInput.setValueStateText(sText);
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

    /**
     * [_maybeShowReason description]
     * @param  {[type]} reason [description]
     * @return {[type]}        [description]
     */
    Login.prototype._maybeShowReason = function (sReason) {
      switch(sReason) {
        case "auth":
          jQuery.sap.delayedCall(500, this, jQuery.proxy(function() {
            this.showErrorAlert(
              "Woah. Looks like your session expired. Please log in again to get back to it.",
              "Session expired",
              sap.ui.Device.system.phone
            );
          }, this), []);
          break;
      }
    };
    /***
     *     █████╗ ██╗   ██╗████████╗██╗  ██╗
     *    ██╔══██╗██║   ██║╚══██╔══╝██║  ██║
     *    ███████║██║   ██║   ██║   ███████║
     *    ██╔══██║██║   ██║   ██║   ██╔══██║
     *    ██║  ██║╚██████╔╝   ██║   ██║  ██║
     *    ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
     *
     */

    /**
     * When login is pressed, we validate the username and password
     * combination, and navigate to the dash.
     * @param  {object} oEvent button press event
     */
    Login.prototype.onSignInButtonPress = function(oEvent) {
      // The rest of this code assumes you are not using a library.
      // It can be made less wordy if you use one.
      var form = document.createElement("form");
      form.setAttribute("method", "post");
      form.setAttribute("action", "http://localhost:8080/auth/login");
      var params = {
        email : this.getView().byId("idLoginEmail").getValue(),
        password : this.getView().byId("idLoginPassword").getValue()
      };

      for(var key in params) {
          if(params.hasOwnProperty(key)) {
              var hiddenField = document.createElement("input");
              hiddenField.setAttribute("type", "hidden");
              hiddenField.setAttribute("name", key);
              hiddenField.setAttribute("value", params[key]);

              form.appendChild(hiddenField);
           }
      }

      document.body.appendChild(form);
      form.submit();
    };

    /**
     * Register button. Wait a second, someone wants to register?!?! Yippee!!!
     * @param  {object} oEvent button event
     */
    Login.prototype.onRegisterButtonPress = function(oEvent) {
      // The rest of this code assumes you are not using a library.
      // It can be made less wordy if you use one.
      var form = document.createElement("form");
      form.setAttribute("method", "post");
      form.setAttribute("action", "http://localhost:8080/auth/signup");
      var params = {
        email : this.getView().byId("idRegisterEmail").getValue(),
        password : this.getView().byId("idRegisterPassword").getValue()
      };

      for(var key in params) {
          if(params.hasOwnProperty(key)) {
              var hiddenField = document.createElement("input");
              hiddenField.setAttribute("type", "hidden");
              hiddenField.setAttribute("name", key);
              hiddenField.setAttribute("value", params[key]);

              form.appendChild(hiddenField);
           }
      }

      document.body.appendChild(form);
      form.submit();
    };

    /**
     * Authenticate the user, by sending them to Google OAuth
     * @param  {[type]} oEvent [description]
     */
    Login.prototype.onGooglePress = function(oEvent) {
      window.location.href = "http://localhost:8080/auth/google";
    };

    /**
     * Authenticate the user, by sending them to Google OAuth
     * @param  {[type]} oEvent [description]
     */
    Login.prototype.onTwitterPress = function(oEvent) {
      window.location.href = "http://localhost:8080/auth/twitter";
    };

    /**
     * Authenticate the user, by sending them to Google OAuth
     * @param  {[type]} oEvent [description]
     */
    Login.prototype.onLinkedInPress = function(oEvent) {
      window.location.href = "http://localhost:8080/auth/linkedin";
    };

    /**
     * Authenticate the user, by sending them to Google OAuth
     * @param  {[type]} oEvent [description]
     */
    Login.prototype.onSCNPress = function(oEvent) {
      window.location.href = "http://localhost:8080/auth/scn";
    };

    return Login;

  }, /* bExport= */ true);
