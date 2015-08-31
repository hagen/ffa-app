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

    /***
     *    ██╗      ██████╗  ██████╗ ██╗███╗   ██╗
     *    ██║     ██╔═══██╗██╔════╝ ██║████╗  ██║
     *    ██║     ██║   ██║██║  ███╗██║██╔██╗ ██║
     *    ██║     ██║   ██║██║   ██║██║██║╚██╗██║
     *    ███████╗╚██████╔╝╚██████╔╝██║██║ ╚████║
     *    ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝
     *
     */

    /**
     * When login is pressed, we validate the username and password
     * combination, and navigate to the dash.
     * @param  {object} oEvent button press event
     */
    Login.prototype.onSignInButtonPress = function(oEvent) {

      // Validate the user-entered conditions
      let oEmailInput = this.getView().byId("idLoginEmail");
      let oPasswordInput = this.getView().byId("idLoginPassword");
      let bContinue = false;

      // Email validation...
      if (!(this._validateEmail(oEmailInput) && this._validatePassword(oPasswordInput))) {
        return;
      }

      // The rest of this code assumes you are not using a library.
      // It can be made less wordy if you use one.
      this._submitForm("http://localhost:8080/auth/local/login", "post", {
        email: oEmailInput.getValue(),
        password: oPasswordInput.getValue()
      });
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
      this._validateEmail(oInput);
    };

    /**
     * Register button. Wait a second, someone wants to register?!?! Yippee!!!
     * @param  {object} oEvent button event
     */
    Login.prototype.onRegisterButtonPress = function(oEvent) {

      // Validate the user-entered conditions
      let oEmailInput = this.getView().byId("idRegisterEmail");
      let oPasswordInput = this.getView().byId("idRegisterPassword");
      let bContinue = false;

      // Email validation...
      if (!(this._validateEmail(oEmailInput) && this._validatePassword(oPasswordInput))) {
        return;
      }

      // Check the email is not being used
      if (this._emailExists(oEmailInput)) {
        return;
      }

      // The rest of this code assumes you are not using a library.
      // It can be made less wordy if you use one.
      this._submitForm("http://localhost:8080auth/local/register", "post", {
        email: oEmailInput.getValue(),
        password: oPasswordInput.getValue()
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
     *     █████╗ ██╗   ██╗████████╗██╗  ██╗
     *    ██╔══██╗██║   ██║╚══██╔══╝██║  ██║
     *    ███████║██║   ██║   ██║   ███████║
     *    ██╔══██║██║   ██║   ██║   ██╔══██║
     *    ██║  ██║╚██████╔╝   ██║   ██║  ██║
     *    ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
     *
     */

    /**
     * Submit a form as the means of sending to back end
     * @param  {[type]} sAction [description]
     * @param  {[type]} sMethod [description]
     * @param  {[type]} oParams [description]
     * @return {[type]}         [description]
     */
    Login.prototype._submitForm = function(sAction, sMethod, oParams) {
      // The rest of this code assumes you are not using a library.
      // It can be made less wordy if you use one.
      let form = document.createElement("form");
      form.setAttribute("method", sMethod.toLowerCase());
      form.setAttribute("action", sAction);

      for (let key in oParams) {
        if (oParams.hasOwnProperty(key)) {
          let hiddenField = document.createElement("input");
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", key);
          hiddenField.setAttribute("value", oParams[key]);
          form.appendChild(hiddenField);
        }
      }

      document.body.appendChild(form);
      form.submit();
    };

    /**
     * [_maybeShowReason description]
     * @param  {[type]} reason [description]
     * @return {[type]}        [description]
     */
    Login.prototype._maybeShowReason = function(sReason) {
      switch (sReason) {
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
     *    ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗███████╗
     *    ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
     *    ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   █████╗
     *    ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██╔══╝
     *     ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ███████╗
     *      ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * Validate the supplied email input control's value; additionally, set
     * the input control's state and message
     * @param  {[type]} oInput [description]
     * @return {[type]}        [description]
     */
    Login.prototype._validateEmail = function(oInput) {

      // Validate
      let bValid = false;
      let pattern = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

      // Test
      if (!pattern.test(oInput.getValue())) {
        oInput.setValueState(sap.ui.core.ValueState.Error);
        oInput.setValueStateText("Yikes! This e-mail appears to be invalid!");
        bValid = false;
      } else {
        oInput.setValueState(sap.ui.core.ValueState.Success);
        bValid = true;
      }

      // return result
      return bValid;
    };

    /**
     * Validate the supplied password input control's value; additionally, set
     * the input control's state and message
     * @param  {[type]} oInput [description]
     * @return {[type]}        [description]
     */
    Login.prototype._validatePassword = function(oInput) {

      // Validate
      let bValid = false;

      // Password validation
      if ("" === oInput.getValue()) {
        oInput.setValueState(sap.ui.core.ValueState.Error);
        oInput.setValueStateText("Blank-ity blank blank. You'll need to supply a password.");
        bValid = false;
      } else {
        oInput.setValueState(sap.ui.core.ValueState.Success);
        bValid = true;
      }

      // return result
      return bValid;
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
