jQuery.sap.declare("com.ffa.hpc.view.auth.Token");

// Provides controller view. Token
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/auth/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Token = Controller.extend("com.ffa.hpc.view.auth.Token", /** @lends com.ffa.hpc.view.auth.Token.prototype */ {

    });

    /**
     * On init handler
     */
    Token.prototype.onInit = function() {
      this.getRouter().getRoute("token").attachPatternMatched(this.onRouteMatched, this);
    };

    /**
     * On exit handler
     */
    Token.prototype.onExit = function() {};

    /**
     * On before rendering; add in our 'New region' tile
     * at the beginning of the tile container
     */
    Token.prototype.onBeforeRendering = function() {};

    /**
     * On after rendering - the DOM is now built. Add in our 'New region' tile
     * at the beginning of the tile container
     */
    Token.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler...
     * Currently, this only serves to swap between the two tabs of the login
     * page - sign in and register.
     */
    Token.prototype.onRouteMatched = function(oEvent) {

      // When the route is matched, we either want the login tab or
      // the register tab
      var oParameters = oEvent.getParameters(),
        oRouter = this.getRouter(),
        self = this;

      // Busy
      this.showBusyDialog({});

      // First, check if access_token is supplied. If so, we're authed
      // to go to dash
      if (oParameters.arguments.access_token) {

        // Firstly we handle authentication by checking if this user has the provider's
        // social profile listed against their name. If so, great move on.
        // If not, create the social profile then connect it to the user's
        // profile.
        return this.handleTokenAuth(
          oParameters.arguments.access_token,
          oParameters.arguments.provider,
          function() {
            // Now check if they have an active plan. If not, they will need to sign
            // up.
            self.hasPlan(
              function() { // Yes, this user has an active plan
                self.hideBusyDialog();
                oRouter.navTo("dash", {}, !sap.ui.Device.system.phone);
              },
              function() { // No, this user hasn't picked a plan yet
                self.hideBusyDialog();
                oRouter.navTo("plans", {}, !sap.ui.Device.system.phone);
              },
              function() {
                // error condition handler
              }
            );
          }
        );
      }

      // Otherwise, back to login we go
      this.hideBusyDialog({});
      oRouter.navTo("login", {}, !sap.ui.Device.system.phone);
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
     * Decides whether we need to create a user in the back-end; this is all
     * run synchronously. The user must wait.
     * @param  {String}   sToken    The auth bearer token to use for requests to Node.js
     * @param  {String}   sProvider The provider we're authenticating against.
     * @param  {Function} done      Call when done
     */
    Token.prototype.handleTokenAuth = function(sToken, sProvider, done) {

      var self = this;

      // If nothing is returned, then we need to create the user.
      this.needsProfile(
        function() {
          self.createProfile(function() {
            // and connect it to social
            self.connect(sToken, sProvider, done);
          }, function () {
            // error state...
          });
        },
        function() { // no
          // Doesn't need a profile created. So we can continue on our way...
          done();
        }
      );
    };

    /**
     * Checks if the user needs to have their social profile created in the back-end.
     * If so, the yes handler is called, if not, the no handler is called.
     * @param  {Function} yes Yes, callback handler
     * @param  {Function} no  [description]
     */
    Token.prototype.needsProfile = function(yes, no) {

      // Testuser will be replaced by proxy
      this.getView().getModel("profile").read("/SocialProfiles", {
        filters: [new sap.ui.model.Filter({
          path: 'profile_id',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: 'TESTUSER' // Replaced
        })],
        success: jQuery.proxy(function(oData, mResponse) {
          if (oData.results.length === 0) {
            yes();
          } else {
            no();
          }
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
        }, this),
        async: true
      });
    };

    /**
     * Create the user's braintree account; Create the user's profile in HANA
     * @param  {Function} done      Callback function once done
     * @param  {Function} error     Callback function when errored
     */
    Token.prototype.createProfile = function(done, error) {

      // Create braintree customer
      var oHeaders = {
        Authorization: 'Bearer ' + this.getBearerToken()
      };
      jQuery.ajax({
        url: '/payments/customer',
        type: 'POST',
        headers: oHeaders,
        data: {
          profileId: this.getUserId()
        },
        async: true,
        success: jQuery.proxy(function(oData, mResponse) {
          var sCustomerId = oData.customerId;

          // Create HANA profile, with Braintree customerId
          var oData = {
            id: this.getUserId(), // Controller function
            first_name: "",
            last_name: "",
            email: "",
            customer_id: sCustomerId,
            begda: new Date(Date.now()),
            endda: new Date("9999-12-31T23:59:59")
          };

          // Create the user
          this.getView().getModel("profile").create("/Profiles", oData, {
            success: jQuery.proxy(function(oData, mResponse) {
              // Now we continue on to the Social stuff.
              done();
            }, this),
            error: jQuery.proxy(function(mError) {
              this._maybeHandleAuthError(mError);
              error();
            }, this),
            async: false
          });
        }, this),
        error: jQuery.proxy(function(mError) {
          this._maybeHandleAuthError(mError);
          error();
        }, this)
      });
    };

    /***
     *    ██████╗ ██╗      █████╗ ███╗   ██╗███████╗
     *    ██╔══██╗██║     ██╔══██╗████╗  ██║██╔════╝
     *    ██████╔╝██║     ███████║██╔██╗ ██║███████╗
     *    ██╔═══╝ ██║     ██╔══██║██║╚██╗██║╚════██║
     *    ██║     ███████╗██║  ██║██║ ╚████║███████║
     *    ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝
     *
     */

    /**
     * Checks if this user has a valid usage plan
     * @return {Boolean} [description]
     */
    Token.prototype.hasPlan = function(yes, no, error) {

      this.getView().getModel("profile").read("/CurrentSubscriptions('TESTUSER')", {
        success: jQuery.proxy(function(oData, mResponse) {

          // YES! Active plan - proceed to dashboard
          if (oData.profile_id && yes) { return yes(); }

          // No active plan.
          if (no) { return no(); }
        }, this),
        error: jQuery.proxy(function(mError) {
          if (mError.response.statusCode === 404) {
            // Not found - which means they don't have a plan, and need one
            if (no) { return no(); }
          } else {
            this.maybeHandleAuthError(mError);
            if (error) { error(); }  
          }
        }, this),
        async: true
      });
    };

    return Token;

  }, /* bExport= */ true);
