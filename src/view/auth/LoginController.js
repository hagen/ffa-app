jQuery.sap.declare("com.ffa.hpc.view.auth.LoginController");

// Provides controller view.Login
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/auth/Controller"],
  function(jQuery, Root) {
    "use strict";

    var Login = Root.extend("com.ffa.hpc.view.auth.LoginController", /** @lends com.ffa.hpc.view.auth.LoginController.prototype */ {

    });

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
     * This function will check if the user is logged in, and call the appropriate
     * callback once the decision is made.
     * @param  {Function} fnLoggedIn  Logged in callback Function
     * @param  {Function} fnLoggedOut Logged out callback Function
     */
    Login.prototype.checkLoggedIn = function(fnLoggedIn, fnLoggedOut) {
      if (this.isLoggedIn()) {
        fnLoggedIn();
      } else {
        fnLoggedOut();
      }
    };

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

      // Now we sign in. This is a separate function, so it can be re-used by the demo login...
      // which does not require any validation...
      this.doLogin(oEmailInput.getValue(), oPasswordInput.getValue());
    };

    /**
     * Login to the Node.js server using an email and password....
     * @param  {String} sEmail username/email
     * @param  {String} sPwd   password
     */
    Login.prototype.doLogin = function(sEmail, sPwd) {
      // The rest of this code assumes you are not using a library.
      // It can be made less wordy if you use one.
      var oModel = this.getView().getModel("env");
      this._submitForm(oModel.getProperty("/host") + "/auth/local/login", "post", {
        email: sEmail,
        password: sPwd
      });
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
     * When an authentication event happens, and the user is redirected to
     * login, this function displays a pop=up message in accordance with
     * the reason parameter. The function also quickly navs to the login page
     * proper, so that the route is not visible in the address bar.
     * @param  {String} reason Reason pop-up type
     */
    Login.prototype._maybeShowReason =
      Login.prototype.maybeShowReason = function(sReason) {
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
        case "noauth":
          jQuery.sap.delayedCall(500, this, jQuery.proxy(function() {
            this.showErrorAlert(
              "Looks like your log in details were invalid. Try again...",
              "Invalid log in",
              sap.ui.Device.system.phone
            );
          }, this), []);
          break;
        case "terminated":
          jQuery.sap.delayedCall(500, this, jQuery.proxy(function() {
            this.showSuccessAlert(
              "Your account has been removed. We hope to see you back here soon. Have a wonderful day!",
              "Account terminated",
              sap.ui.Device.system.phone
            );
          }, this), []);
          break;
      }

      // Nav back to normal login, so the user does not see the URL path
      this.getRouter().navTo("login", {}, !sap.ui.Device.system.phone);
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
     * the input control's state and message. This function can optionally Test
     * if the email is already in use.
     * @param  {Control} oInput      Input control (containing the email to validate)
     * @param  {Boolean} bTestExists Also run an existence test against server
     * @return {Boolean}             E-mail is valid, or not
     */
    Login.prototype.validateEmail = function(oInput, bTestExists) {

      // Validate
      var bValid = false,
        sEmail = oInput.getValue();

      // Test
      if (!sEmail) {
        oInput.setValueState(sap.ui.core.ValueState.Error);
        oInput.setValueStateText("Blank-ity blank!");
        bValid = false;
      } else if (!this._validateEmail(sEmail)) {
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
     *    ██████╗ ███████╗███╗   ███╗ ██████╗
     *    ██╔══██╗██╔════╝████╗ ████║██╔═══██╗
     *    ██║  ██║█████╗  ██╔████╔██║██║   ██║
     *    ██║  ██║██╔══╝  ██║╚██╔╝██║██║   ██║
     *    ██████╔╝███████╗██║ ╚═╝ ██║╚██████╔╝
     *    ╚═════╝ ╚══════╝╚═╝     ╚═╝ ╚═════╝
     *
     */

    Login.prototype.onDemoButtonPress = function(oEvent) {
      // Demo button is pressed - we're logging in with a static demo account email
      // and password. These are in the env json file.
      var oModel = this.getView().getModel("env");

      // Function is in Root Login controller
      this.doLogin(oModel.getProperty("/demo_username"), oModel.getProperty("/demo_password"));
    };

    /***
     *    ██╗      ██████╗  ██████╗  ██████╗ ██╗   ██╗████████╗
     *    ██║     ██╔═══██╗██╔════╝ ██╔═══██╗██║   ██║╚══██╔══╝
     *    ██║     ██║   ██║██║  ███╗██║   ██║██║   ██║   ██║
     *    ██║     ██║   ██║██║   ██║██║   ██║██║   ██║   ██║
     *    ███████╗╚██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝   ██║
     *    ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝    ╚═╝
     *
     */

    /**
     * On press, the user will be logged out and their bearer token will
     * be destroyed.
     * @param  {Event} oEvent Button press event
     */
    Login.prototype.onLogoutPress = function(oEvent) {

      // destroy bearer token
      _token = "";
      if (window.localStorage) {
        try {
          window.localStorage.removeItem("_token");
        } catch (e) {
          // dunno. Can't access localStorage
        }
      }

      // redirect to logout
      window.location.href = "/auth/logout";
    };

    return Login;

  }, /* bExport= */ true);
