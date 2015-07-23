jQuery.sap.declare("view.Login");
jQuery.sap.require("thirdparty.spiders.Spiders");

// Provides controller view.Login
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var Login = Controller.extend("view.Login", /** @lends view.Login.prototype */ {

	});

	/**
	 * On init handler
	 */
	Login.prototype.onInit = function() {
		this.getRouter().getRoute("login").attachPatternMatched(this._onRouteMatched, this);
		sap.ui.core.IconPool.addIcon("google", "socicon", { fontFamily: "socicon", content: "0063" });
		sap.ui.core.IconPool.addIcon("twitter", "socicon", { fontFamily: "socicon", content: "0061" });
		sap.ui.core.IconPool.addIcon("linkedin", "socicon", { fontFamily: "socicon", content: "006A" });
	};

	/**
	 * On exit handler
	 */
	Login.prototype.onExit = function() {};

	/**
	 * On before rendering; add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Login.prototype.onBeforeRendering = function() {
	};

	/**
	 * On after rendering - the DOM is now built. Add in our 'New region' tile
	 * at the beginning of the tile container
	 */
	Login.prototype.onAfterRendering = function() {};

	/**
	 * Route matched handler...
	 * Currently, this only serves to swap between the two tabs of the login
	 * page - sign in and register.
	 */
	Login.prototype._onRouteMatched = function(oEvent) {
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
	Login.prototype.onTabSelect = function(oEvent) {
		// Now we can nav to the detail page.
		this.getRouter().navTo("login", {
			tab : oEvent.getParameter("selectedKey")
		}, true);
	};

	/**
	 * Register tab, email notification/checking. This is used as a proxy
	 * to remind the user thay they must supply a valid email address. It will
	 * also validate the email address.
	 */
	Login.prototype.onRegisterEmailChange = function(oEvent) {
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

	/**
	 * Register button. Wait a second, someone wants to register?!?! Yippee!!!
	 */
	Login.prototype.onRegisterButtonPress = function(oEvent) {
		// Show that we are very busy
		if (!this._oBusyDialog) {
		  this._oBusyDialog = sap.ui.xmlfragment("view.BusyDialog", this);
		  this.getView().addDependent(this._oBusyDialog);
		}
		this._oBusyDialog.open();

		// We're gong to pause for a second...
    jQuery.sap.delayedCall(3000, this, function () {
			// And navigate to plans
			this.getRouter().navTo("plans", {}, !sap.ui.Device.system.phone);
			this._oBusyDialog.close();
    });
	};

	return Login;

}, /* bExport= */ true);
