jQuery.sap.declare("view.auth.SignIn");

// Provides controller view.Signin
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Signin = Controller.extend("view.auth.SignIn", /** @lends view.auth.SignIn.prototype */ {

    });

    /**
     * On init handler
     */
    Signin.prototype.onInit = function() {
      this.getRouter().getRoute("auth").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     * On exit handler
     */
    Signin.prototype.onExit = function() {};

    /**
     * On before rendering; add in our 'New region' tile
     * at the beginning of the tile container
     */
    Signin.prototype.onBeforeRendering = function() {};

    /**
     * On after rendering - the DOM is now built. Add in our 'New region' tile
     * at the beginning of the tile container
     */
    Signin.prototype.onAfterRendering = function() {
      jQuery.sap.require("thirdparty.spiders.Spiders");
    };

    /**
     * Route matched handler...
     * Currently, this only serves to swap between the two tabs of the login
     * page - sign in and register.
     */
    Signin.prototype._onRouteMatched = function(oEvent) {
      // When the route is matched, we either want the login tab or
      // the register tab
      var oParameters = oEvent.getParameters();
      var oView = this.getView();

      // and tab... if tab is not set locally, set it; if parameter
      // is not supplied, and no local version, default.
      // Otherwise, leave the tab key alone
      if (!this._sTabKey) {
        this._sTabKey = oParameters.arguments.tab || "signin";
      } else if (oParameters.arguments.tab) {
        this._sTabKey = oParameters.arguments.tab;
      }

      // Lastly, we'll make sure the correct tab is selected. If it's not,
      // select it
      var oIconTabBar = oView.byId("idSignInIconTabBar");
      if (oIconTabBar.getSelectedKey() !== this._sTabKey) {
        oIconTabBar.setSelectedKey(this._sTabKey);
      }
    };

    /**
     * Tab bar handling
     */
    Signin.prototype.onTabSelect = function(oEvent) {
      // Now we can nav to the detail page.
      this.getRouter().navTo("login", {
        tab: oEvent.getParameter("selectedKey")
      }, true);
    };

    /**
     * Register tab, email notification/checking. This is used as a proxy
     * to remind the user thay they must supply a valid email address. It will
     * also validate the email address.
     */
    Signin.prototype.onRegisterEmailChange = function(oEvent) {
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
    Signin.prototype.onShowPasswordCheckBoxSelect = function(oEvent) {
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
    Signin.prototype.onSignInButtonPress = function(oEvent) {
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
    Signin.prototype.onRegisterButtonPress = function(oEvent) {
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
    Signin.prototype.onGooglePress = function(oEvent) {
      window.location.href = "http://localhost:8080/auth/google";
    };

    /**
     * Authenticate the user, by sending them to Google OAuth
     * @param  {[type]} oEvent [description]
     */
    Signin.prototype.onTwitterPress = function(oEvent) {
      window.location.href = "http://localhost:8080/auth/twitter";
    };

    /**
     * Authenticate the user, by sending them to Google OAuth
     * @param  {[type]} oEvent [description]
     */
    Signin.prototype.onLinkedInPress = function(oEvent) {
      window.location.href = "http://localhost:8080/auth/linkedin";
    };

    /**
     * Authenticate the user, by sending them to Google OAuth
     * @param  {[type]} oEvent [description]
     */
    Signin.prototype.onSCNPress = function(oEvent) {
      window.location.href = "http://localhost:8080/auth/scn";
    };

    return Signin;

  }, /* bExport= */ true);
