jQuery.sap.declare("view.plans.Plans");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'view/plans/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var Plans = Controller.extend("view.plans.Plans", /** @lends view.plans.Plans.prototype */ {
		_oTileTemplate : null,
		_sPlanId : false
	});

	/**
	 * On init handler
	 */
	Plans.prototype.onInit = function() {
		// Handle route matching.
		this.getRouter().getRoute("plans").attachPatternMatched(this._onPlansRouteMatched, this);
		this.getRouter().getRoute("change-plan").attachPatternMatched(this._onChangeRouteMatched, this);
		this._oTileTemplate = new sap.m.StandardTile({
				icon : "sap-icon://{settings>icon}",
				info : "{settings>info}",
				infoState : "{settings>info_state}",
				type : "{settings>type}",
				number : "{settings>number}",
				numberUnit : "{settings>unit}",
				title : "{settings>title}",
				press : this.onPlansTilePress
		});
	};

	/**
	 * On exit handler
	 */
	Plans.prototype.onExit = function() {};

	/**
	 * On before rendering; add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Plans.prototype.onBeforeRendering = function() { };

	/**
	 * On after rendering - the DOM is now built. Add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Plans.prototype.onAfterRendering = function() {
		jQuery.sap.require("thirdparty.spiders.Spiders");
	};

	/**
	 * Route matched handler...
	 */
	Plans.prototype._onPlansRouteMatched = function(oEvent) {

		// Continue
		let oTileContainer = this.getView().byId("idPlansTileContainer");
		oTileContainer.bindAggregation("tiles", {
			path : 'settings>/PlanTypes',
			sorters: [new sap.ui.model.Sorter({
				path : 'order',
				descending: false
			})],
			template : this._oTileTemplate
		});
	};

	/**
	 * When the user is changing their plan, they'll be offered a listing of plans
	 * to upgrade/downgrade to, not including Enterprise or their current plan.
	 * @param  {[type]} oEvent [description]
	 * @return {[type]}        [description]
	 */
	Plans.prototype._onChangeRouteMatched = function(oEvent) {

		// Currently busy!
		this.showBusyDialog();

		// set up
		let oModel = this.getView().getModel("settings");
		this._sPlanId = oModel.getProperty("/Profiles('TESTUSER')/plan_type_id") ||
											oModel.getProperty("/CurrentProfilePlans('TESTUSER')/plan_type_id");
		let oPromise = jQuery.Deferred();

		// If undefined, we need to read from Odata
		if (!this._sPlanId) {
			// Read from Odata
			oModel.read("/CurrentProfilePlans('TESTUSER')", {
				success : jQuery.proxy(function(oData, mRepsonse) {
					this._sPlanId = oData.plan_type_id;
					oPromise.resolve();
				}, this),
				error : jQuery.proxy(function(mError) {
					this._maybeHandleAuthError(mError);
				}, this)
			})
		} else {
			// Resolve the promise
			oPromise.resolve();
		}

		// We need to dynamically bind to the Tile Container, and only display
		// those tiles that are not the current plan and not the Enterprise plan
		jQuery.when(oPromise).then(jQuery.proxy(function() {
			let oTileContainer = this.getView().byId("idPlansTileContainer");
			oTileContainer.bindAggregation("tiles", {
				path : 'settings>/PlanTypes',
				sorters: [new sap.ui.model.Sorter({
					path : 'order',
					descending: false
				})],
				filters : [new sap.ui.model.Filter({
					filters : [new sap.ui.model.Filter({
						path : 'id',
						operator : sap.ui.model.FilterOperator.NE,
						value1 : this._sPlanId
					}), new sap.ui.model.Filter({
						path : 'id',
						operator : sap.ui.model.FilterOperator.NE,
						value1 : 'enterprise'
					})],
					and : true
				})],
				template : this._oTileTemplate
			});

			// Not busy any more
			this.hideBusyDialog();
		}, this));
	};

	/***
	 *    ████████╗██╗██╗     ███████╗    ███████╗██╗   ██╗███████╗███╗   ██╗████████╗███████╗
	 *    ╚══██╔══╝██║██║     ██╔════╝    ██╔════╝██║   ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
	 *       ██║   ██║██║     █████╗      █████╗  ██║   ██║█████╗  ██╔██╗ ██║   ██║   ███████╗
	 *       ██║   ██║██║     ██╔══╝      ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ╚════██║
	 *       ██║   ██║███████╗███████╗    ███████╗ ╚████╔╝ ███████╗██║ ╚████║   ██║   ███████║
	 *       ╚═╝   ╚═╝╚══════╝╚══════╝    ╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
	 *
	 */

	/**
	 * Handles tile press for any one of the available plans.
	 * @param  {object} oEvent Tile press event object
	 */
	Plans.prototype.onPlansTilePress = function(oEvent) {

		// what's the bound index?
		let oTile = oEvent.getSource();
		let oContext = oTile.getBindingContext("settings");;

		// Bind dialog to correct plan
		let oDialog =	this.getView().byId("idPlanDetailsDialog");
		oDialog.bindElement("settings>/PlanTypes('" + oContext.getProperty("id") + "')");

		// now show the dialog
		oDialog.open();
	};

	/***
	 *    ██████╗ ██╗ █████╗ ██╗      ██████╗  ██████╗
	 *    ██╔══██╗██║██╔══██╗██║     ██╔═══██╗██╔════╝
	 *    ██║  ██║██║███████║██║     ██║   ██║██║  ███╗
	 *    ██║  ██║██║██╔══██║██║     ██║   ██║██║   ██║
	 *    ██████╔╝██║██║  ██║███████╗╚██████╔╝╚██████╔╝
	 *    ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝
	 *
	 */

	/**
	 * Dialog close button press
	 * @param  {object} oEvent Button press event
	 */
	Plans.prototype.onPlansDetailsClosePress = function(oEvent) {
		this.getView().byId("idPlanDetailsDialog").close();
	};

	/**
	 * Currently navigates to dash
	 * @param  {object} oEvent Button press event
	 */
	Plans.prototype.onPlanDetailsGoPress = function(oEvent) {
		// What's our new plan?
		let sPlanId = oEvent.getSource().data("planType");
		if (this._sPlanId) {
			this._handlePlanChange(this._sPlanId /* old */, sPlanId /* new */);
		} else {
			// For new plans, nav straight away
			this.getRouter().navTo("plan-" + sType, {}, !sap.ui.Device.system.phone);
		}
	};

	/**
	 * Given the old and new plans, this function updates the user's plan, and
	 * updates their billing details. So, what needs to be done. Well, we firstly
	 * let's check their usage - if they are over the limits afforded, upgrade
	 * /downgrade is not allowed. Once this is approved, we can continue.
	 * try to update their billing details in Braintree. Call Node to do this. Once
	 * done, we then try and update their details in HANA. Once both of these items,
	 * are completed, we're finished.
	 * @param  {[type]} sOld [description]
	 * @param  {[type]} sNew [description]
	 * @return {[type]}      [description]
	 */
	Plans.prototype.handlePlanChange = function (sOld, sNew) {
		// So busy right
		this.showBusyDialog();

		// Declare a holder for our error message, if any
		let sMessage = "";
		// Check usage limits
		try {
			this._checkForecastCount(sOld, sNew);
		} catch (e) {
			sMessage += e.message;
		}

		// Check data limits
		try {
			this._checkDataSize(sOld, sNew);
		} catch (e) {
			sMessage += e.message;
		}

		// If there's a message, then display and stop processing.
		if (sMessage !== "") {
			this.showErrorAlert({
				title : "Plan change not possible",
				message : sMessage
			});

			// Not busy any more.
			this.hideBusyDialog();
			return;
		}

		// Now we do the updates
		try {
			// Update payments will try and move the user on to the new subscription.
			// Of course, this behaviour will change depending on the down/upgrade
			// path
			this._updatePayments(sOld, sNew);
		} catch (e) {

		}


		// Not busy any more
		this.hideBusyDialog();
	};

	/**
	 * Makes a decision about what down/upgrade is taking place, then calls Node
	 * to perform the Braintree update.
	 * @param  {[type]} sOldPlan [description]
	 * @param  {[type]} sNewPlan [description]
	 * @return {[type]}          [description]
	 */
	Plans.prototype._updatePayments = function (sOldPlan, sNewPlan) {

		// Collect the model
		let oModel = this.getView().getModel("settings");
		let sPath = "/Profiles('TESTUSER')";

		// We will need to collect the user's current subscription.
		let sSubscriptionId = oModel.getProperty(sPath + "/subscription_id");
		if(!sSubscriptionId) {
			oModel.read(sPath, {
				async : false,
				success : jQuery.proxy(function (oData, mRepsonse){
					// take the subscription id from the profile
					sSubscriptionId = oData.subscription_id;
				}, this),
				error : jQuery.proxy(function (mError){
					this._maybeHandleAuthError(mError);

					// throw an error to get out of here
					throw new Error({
						message : "There was a problem reading your profile",
						error : mError
					});
				}, this)
			});
		}

		// Call Node to perform the subscription change; note that subscriptionId
		// may be blank. This means that the user was previously on free plan.
		jQuery.ajax({
			url: '/payments/upgrade/' + sNewPlan,
			type: 'POST',
			headers: this.getJqueryHeaders(),
			data : { subscriptionId : sSubscriptionId },
			async: false,
			success: jQuery.proxy(function(oData, mResponse) {
				// Plan has been upgraded, so let's update the profile
				// with the new subscription Id
				sSubscriptionId = oData.id; // the new subscription
			}, this),
			error: jQuery.proxy(function(mError) {
				// handle auth error as normal
				this._maybeHandleAuthError(mError);

				// throw an error to get out of here
				throw new Error({
					message : "Couldn't update your subscription details",
					error : mError
				});
			}, this)
		});

		// Now we can update the user's profile to plans listing by inserting
		// a new record. This has the effect of delimiting the old record, and creating
		let oPayload = {
			id : "",
			profile_id : this.getProfileId(),
			plan_type_id : sNewPlan,
			subscription_id : sSubscriptionId,
			begda : new Date(Date.now()), // Doesn't matter
			endda : new Data(0) // Doesn't matter
		};

		// And create the record
		oModel.create("/ProfilePlans", oPaylod, {
			async : false,
			success : jQuery.proxy(function(oData, mResponse) {
				// Huz-zah, the record has been created, and the user is now bumped up
				// to another subscription.
			}),
			error : jQuery.proxy(function (mError) {
				this._maybeHandleAuthError(mError);
			})
		});
	};

	return Plans;

}, /* bExport= */ true);
