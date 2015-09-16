jQuery.sap.declare("view.settings.Social");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/settings/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Social = Controller.extend("view.settings.Social", /** @lends view.settings.Social.prototype */ {

    });

    /**
     *
     */
    Social.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("social").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Social.prototype.onExit = function() {};

    /**
     *
     */
    Social.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Social.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Social.prototype._onRouteMatched = function(oEvent) {
      // Make sure we have a meta data document
      this._checkMetaDataLoaded("profile");

      // Let the master list know I'm on this Folders view.
      this.getEventBus().publish("Social", "RouteMatched", {} /* payload */ );

      // Bind this page to the Social Id...
      var oPage = this.getView().byId("idSocialPage");
      oPage.bindElement("profile>/Profiles('TESTUSER')");
    };

    /**
     * When a social icon tile is pressed, we are either linking, or unlinking
     * this profile from the account. This has to happen in Node.js and in HANA.
     * This can therefore take some time to perform. Eventually, we'll end up Back
     * here, so this controller's route handler has to recognise that scenario
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Social.prototype.onSocialTilePress = function(oEvent) {
      var oTile = oEvent.getSource();
      var oContext = oTile.getBindingContext("profile");
      var sType = oContext.getProperty("type");

      // if this tile is linked, we are unlinking, and vice versa.
      if (oContext.getProperty("linked") === "X") {
        // unlink

        var fn = "_disconnect" + sType.charAt(0).toUpperCase() + sType.slice(1);
        if (typeof this[fn] === "function") {
          this[fn].apply(this, []);
        }
        // Set the tile to be NOT linked (refresh TC binding)
        oTile.getParent().getBinding("tiles").refresh();
      } else {
        if (sType === "local") {
          // Show pop-up
          this.getView().byId("idConnectDialog").open();
        } else {
          // Go straight to social connect href.
          this._hrefToConnect(sType);
        }
      }
    };

    /***
     *    ██╗     ██╗███╗   ██╗██╗  ██╗██╗███╗   ██╗ ██████╗
     *    ██║     ██║████╗  ██║██║ ██╔╝██║████╗  ██║██╔════╝
     *    ██║     ██║██╔██╗ ██║█████╔╝ ██║██╔██╗ ██║██║  ███╗
     *    ██║     ██║██║╚██╗██║██╔═██╗ ██║██║╚██╗██║██║   ██║
     *    ███████╗██║██║ ╚████║██║  ██╗██║██║ ╚████║╚██████╔╝
     *    ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝
     *
     */

    /**
     * Set up the link token in Node, then reedirect to the relevant
     * href
     * @param  {[type]} sType [description]
     * @return {[type]}       [description]
     */
    Social.prototype._hrefToConnect = function(sType) {
      // store link request Id
      var sLinkId = jQuery.sap.uid();
      window.localStorage.setItem("_link", sLinkId);

      // POST the link Id to back-end, including current bearer token.
      var oHeaders = {
        Authorization: 'Bearer ' + this.getBearerToken()
      };
      var sMessage = "";
      jQuery.ajax({
        url: '/auth/profile/link',
        type: 'POST',
        data: {
          link: sLinkId
        },
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
    Social.prototype._unlinkNode = function(sPath) {
      var oHeaders = {
        Authorization: 'Bearer ' + _token
      }; /* Global var */
      var sMessage = "";
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
    Social.prototype._delimitHana = function(sPath) {
      this.getView().getModel("profile").remove(sPath, {
        success: jQuery.proxy(function(oData, mResponse) {
          var sMessage = 1;
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
    Social.prototype._disconnectLocal = function() {
      // unlink node js version
      this._unlinkNode("/disconnect/local");
      // And now HANA
      this._delimitHana("/LocalSocials('TESTUSER')");
    };

    /**
     * Call Node and unlink. Then call HANA and unlink.
     * @return {[type]} [description]
     */
    Social.prototype._disconnectGoogle = function() {
      // unlink node js version
      this._unlinkNode("/disconnect/google");
      // And now HANA
      this._delimitHana("/GoogleSocials('TESTUSER')");
    };

    /**
     * Call Node and unlink. Then call HANA and unlink.
     * @return {[type]} [description]
     */
    Social.prototype._disconnectTwitter = function() {
      // unlink node js version
      this._unlinkNode("/disconnect/twitter");
      // And now HANA
      this._delimitHana("/TwitterSocials('TESTUSER')");
    };

    /**
     * Call Node and unlink. Then call HANA and unlink.
     * @return {[type]} [description]
     */
    Social.prototype._disconnectLinkedin = function() {
      // unlink node js version
      this._unlinkNode("/disconnect/linkedin");
      // And now HANA
      this._delimitHana("/LinkedInSocials('TESTUSER')");
    };


    /***
     *    ██╗      ██████╗  ██████╗ █████╗ ██╗
     *    ██║     ██╔═══██╗██╔════╝██╔══██╗██║
     *    ██║     ██║   ██║██║     ███████║██║
     *    ██║     ██║   ██║██║     ██╔══██║██║
     *    ███████╗╚██████╔╝╚██████╗██║  ██║███████╗
     *    ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝
     *
     */

    /**
     * Clear the local connect form, and close.
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Social.prototype.onLocalConnectCancelPress = function(oEvent) {
      // clear the form
      jQuery.each([this.getView().byId("idConnectEmail"), this.getView().byId("idConnectPassword")], function(i, o) {
        o.setValue("");
        o.setValueState(sap.ui.core.ValueState.None);
      })

      // and close
      this.getView().byId("idConnectDialog").close();
    };

    /**
     * Capture values from the local form, and submit
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Social.prototype.onLocalConnectOkPress = function(oEvent) {

      // Collect form details
      var oEmailInput = this.getView().byId("idConnectEmail");
      var oPasswordInput = this.getView().byId("idConnectPassword");
      var bContinue = false;

      // Email validation...
      if (!(this._validateEmail(oEmailInput) && this._validatePassword(oPasswordInput))) {
        return;
      }

      // set the dialog to busy
      var oDialog = this.getView().byId("idConnectDialog");
      oDialog.setBusy(true);

      // Now POST ajax request to Node; this will create the local details And
      // do the merge. This only happens for local connect.
      var oResult = {};
      jQuery.ajax({
        url: 'connect/local/',
        data: {
          email: oEmailInput.getValue(),
          password: oPasswordInput.getValue(),
          accessToken: this.getBearerToken()
        },
        type: 'POST',
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {
          oResult = oData;
          this.getView().byId("idConnectDialog").close();
          bContinue = true;
        }, this),
        error: jQuery.proxy(function(mError) {
          bContinue = false;
        }, this)
      })

      // If bContinue
      if (!bContinue) {
        return;
      }

      var oProfile = {
        profile_id: this.getUserId(),
        email: oEmailInput.getValue(),
        linked: 'X'
      };

      // Now we can update HANA.
      var oHeaders = {
        Authorization: 'Bearer ' + this.getBearerToken()
      };
      this.getView().getModel("profile").update("/LocalProfiles('TESTUSER')", oProfile, {
        headers : oHeaders,
        success: jQuery.proxy(function(oData, mResponse) {
          // Now we continue on to the Social stuff.
          bContinue = true;
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: false,
        merge: true
      });

      // Now close the dialog, and update the tiles
      this.getView().byId("idSocialTileContainer").getBinding("tiles").refresh();

      // set the dialog to busy
      oDialog.setBusy(false);
      oDialog.close();
    };

    /**
     * Validate the supplied email input control's value; additionally, set
     * the input control's state and message
     * @param  {[type]} oInput [description]
     * @return {[type]}        [description]
     */
    Social.prototype._validateEmail = function(oInput) {

      // Validate
      var bValid = false;
      var pattern = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

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
    Social.prototype._validatePassword = function(oInput) {

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
     * Changes the password input from a password to text, and back again.
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Social.prototype.onShowPasswordCheckBoxSelect = function(oEvent) {
      // oEvent has a parameter - selected. Get it
      var bSelected = oEvent.getParameter("selected");

      // We'll also need the password field for the REGISTER form.
      var oInput = this.getView().byId("idConnectPassword");
      if (oInput.getType() === sap.m.InputType.Password) {
        oInput.setType(sap.m.InputType.Text);
      } else {
        oInput.setType(sap.m.InputType.Password);
      }
    };

    return Social;

  }, /* bExport= */ true);
