jQuery.sap.declare("view.plans.Free");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'view/plans/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var Free = Controller.extend("view.plans.Free", /** @lends view.plans.Free.prototype */ {

	});

	/**
	 * On init handler
	 */
	Free.prototype.onInit = function() {
		// Handle route matching.
		this.getRouter().getRoute("plan-free").attachPatternMatched(this._onRouteMatched, this);
	};

	/**
	 * On exit handler
	 */
	Free.prototype.onExit = function() {};

	/**
	 * On before rendering; add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Free.prototype.onBeforeRendering = function() {	};

	/**
	 * On after rendering - the DOM is now built. Add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Free.prototype.onAfterRendering = function() {	};

	/**
	 * Route matched handler...
	 */
	Free.prototype._onRouteMatched = function(oEvent) {
		let oUpdatePromise = jQuery.Deferred();
		let oTimerPromise = jQuery.Deferred();
		let self = this;

		// When our promises return, we can close the busy dialog and nav
		jQuery.when(oTimerPromise).then(function() {
			jQuery.when(oUpdatePromise).then(function() {
				self.hideBusyDialog();
				self.getRouter().navTo("dash", {}, !sap.ui.Device.system.phone);
			});
		});

		// Busy!
		this.showBusyDialog({
			title : "Preparing",
			text : "Creating your Free account. Be with you in a jiffy.",
			showCancelButton : false
		});

		// Resolve timer promise after 1.5 seconds
		jQuery.sap.delayedCall(3000, this, function() {
			oTimerPromise.resolve();
		}, []);

		// Update the user's account
		let oModel = this.getView().getModel("settings");
		oModel.update("/Profiles('TESTUSER')", {
			plan_type_id : 'free',
			customer_id : 'none'
		}, {
			success : function(oData, mResponse) {
				oUpdatePromise.resolve();
			},
			error : function(mError) {
				oUpdatePromise.resolve();
			},
			async : false,
			merge : true
		});
	};

	return Free;

}, /* bExport= */ true);
