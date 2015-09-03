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
			this._updatePayments(sOld, sNew);
		} catch (e) {

		}


		// Not busy any more
		this.hideBusyDialog();
	};
	return Plans;

}, /* bExport= */ true);
