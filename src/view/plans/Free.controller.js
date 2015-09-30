jQuery.sap.declare("com.ffa.hpc.view.plans.Free");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'com/ffa/hpc/view/plans/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Free = Controller.extend("com.ffa.hpc.view.plans.Free", /** @lends com.ffa.hpc.view.plans.Free.prototype */ {

    });

    /**
     * On init handler
     */
    Free.prototype.onInit = function() {
      // Handle route matching.
      this.getRouter().getRoute("plan-free").attachPatternMatched(this._onRouteMatched, this);
      this.getRouter().getRoute("change-plan-free").attachPatternMatched(this._onChangeRouteMatched, this);
    };

    /**
     * On exit handler
     */
    Free.prototype.onExit = function() {};

    /**
     * On before rendering; add in our 'New region' tile
     * at the beginning of the tile container
     */
    Free.prototype.onBeforeRendering = function() {};

    /**
     * On after rendering - the DOM is now built. Add in our 'New region' tile
     * at the beginning of the tile container
     */
    Free.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler...
     */
    Free.prototype._onRouteMatched = function(oEvent) {
      var oCreatePromise = jQuery.Deferred();
      var oTimerPromise = jQuery.Deferred();
      var self = this;

      // Busy!
      this.showBusyDialog({
        title: "Preparing",
        text: "Creating your Free account. Be with you in a jiffy.",
        showCancelButton: false
      });

      // When our promises return, we can close the busy dialog and nav
      jQuery.when(oTimerPromise).then(function() {
        jQuery.when(oCreatePromise).then(function() {
          self.hideBusyDialog();
          self.getRouter().navTo("dash", {}, !sap.ui.Device.system.phone);
        });
      });

      // Create the subscriotion
      this._create(oTimerPromise, oCreatePromise);
    };

    /**
     * Route matched handler...
     */
    Free.prototype._onChangeRouteMatched = function(oEvent) {
      var oCreatePromise = jQuery.Deferred();
      var oTimerPromise = jQuery.Deferred();
      var self = this;

      // Busy!
      this.showBusyDialog({
        title: "Switching",
        text: "Changing your subscription to a Free account. Be with you in a jiffy.",
        showCancelButton: false
      });

      // When our promises return, we can close the busy dialog and nav
      jQuery.when(oTimerPromise).then(function() {
        jQuery.when(oCreatePromise).then(function() {
          self.hideBusyDialog();
          self.getRouter().navTo("account", {}, !sap.ui.Device.system.phone);
        });
      });

      // Create the subscriotion
      this._create(oTimerPromise, oCreatePromise);
    };

		/**
		 * Create the Free subscription
		 * @param  {[type]} oTimerPromise  [description]
		 * @param  {[type]} oCreatePromise [description]
		 * @return {[type]}                [description]
		 */
    Free.prototype._create = function(oTimerPromise, oCreatePromise) {

      // Resolve timer promise after 1.5 seconds
      jQuery.sap.delayedCall(3000, this, function() {
        oTimerPromise.resolve();
      }, []);

      // Update the user's account
      var oModel = this.getView().getModel("profile");
      oModel.create("/Subscriptions", {
        id : "", // Will be updated
				subscription_id : "",
				profile_id : this.getProfileId(),
        plan_type_id: 'free',
        begda : new Date(Date.now()),
				endda : new Date(0), // Will be updated
      }, {
				async: false,
        success: function(oData, mResponse) {
          oCreatePromise.resolve();
        },
        error: function(mError) {
          oCreatePromise.resolve();
        }
      });
    };

    return Free;

  }, /* bExport= */ true);
