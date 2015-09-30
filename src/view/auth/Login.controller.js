jQuery.sap.declare("com.ffa.hpc.view.auth.Login");

// Provides controller view.Login
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/auth/Controller"],
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
      jQuery.sap.require("com.ffa.hpc.thirdparty.spiders.Spiders");
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
      var oEmailInput = this.getView().byId("idLoginEmail");
      var oPasswordInput = this.getView().byId("idLoginPassword");
      var bContinue = false;

      // Email validation...
      if (!(this.validateEmail(oEmailInput, false /* bTestExists */ ) && this._validatePassword(oPasswordInput))) {
        return;
      }

      // The rest of this code assumes you are not using a library.
      // It can be made less wordy if you use one.
      var oModel = this.getView().getModel("env");
      this._submitForm(oModel.getProperty("/host") + "/auth/local/login", "post", {
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
      var form = document.createElement("form");
      form.setAttribute("method", sMethod.toLowerCase());
      form.setAttribute("action", sAction);

      for (var key in oParams) {
        if (oParams.hasOwnProperty(key)) {
          var hiddenField = document.createElement("input");
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
    Login.prototype.validateEmail = function(oInput, bTestExists) {

      // Validate
      var bValid = false;

      // Test
      if (!this._validateEmail(oInput.getValue())) {
        oInput.setValueState(sap.ui.core.ValueState.Error);
        oInput.setValueStateText("Yikes! This e-mail appears to be invalid!");
        bValid = false;
      } else {
        oInput.setValueState(sap.ui.core.ValueState.Success);
        bValid = true;
      }

      if (!bValid) {
        return bValid;
      }

      if (bTestExists) {
        // Check the email is not being used
        bValid = !this._emailExists(oInput);
      }

      // return result
      return bValid;
    };

    /**
     * Validate the supplied email input control's value; additionally, set
     * the input control's state and message
     * @param  {[type]} oInput [description]
     * @return {[type]}        [description]
     */
    Login.prototype._emailExists = function(oInput) {

      // Validate
      var bExists = true;

      // Call unauthenticated GET end point in Node to check if an email exists.
      jQuery.ajax({
        type: 'GET',
        url: '/register/check/' + oInput.getValue(),
        async: false,
        success: function(oData, mResonse) {
          if (oData.in_use !== undefined) {
            bExists = oData.in_use;
          } else {
            bExists = true;
          }
        },
        error: function(mError) {
          bExists = true;
        },
      });

      if (bExists) {
        oInput.setValueState(sap.ui.core.ValueState.Error);
        oInput.setValueStateText("Alas, this email is already in use. Please use another.");
      } else {
        oInput.setValueState(sap.ui.core.ValueState.Success);
      }

      // return result
      return bExists;
    };

    /**
     * Validate the supplied password input control's value; additionally, set
     * the input control's state and message
     * @param  {[type]} oInput [description]
     * @return {[type]}        [description]
     */
    Login.prototype._validatePassword = function(oInput) {

      // Validate
      var bValid = false;

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

    /**
     * Checks that the supplied input base control is not empty. If empty,
     * error state is set, and supplied error message is set.
     * @param  {InputBase} oInput  The input base control
     * @param  {String}    ?sError The error message to use (optional)
     * @return {boolean}           Is not empty
     */
    Login.prototype._isNotEmpty = function(oInput, sError) {

      // Do we have an error message?
      if (sError === undefined) {
        sError = "This field cannot be empty"
      }

      // Validate
      var bEmpty = false;

      // Password validation
      if ("" === oInput.getValue()) {
        oInput.setValueState(sap.ui.core.ValueState.Error);
        oInput.setValueStateText(sError);
        bEmpty = true;
      } else {
        oInput.setValueState(sap.ui.core.ValueState.Success);
        bEmpty = false;
      }

      // return result
      return !bEmpty;
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

    return Login;

  }, /* bExport= */ true);
