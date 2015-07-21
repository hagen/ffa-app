jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.ui.core.routing.Router");
jQuery.sap.declare("com.ffa.dash.MyRouter");

sap.ui.core.routing.Router.extend("com.ffa.dash.MyRouter", {

	constructor : function() {
		sap.ui.core.routing.Router.apply(this, arguments);
		this._oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this);
	},
	/**
	 * Custom backwards navigation function (SplitContainer only)
	 */
	myNavBack : function(sRoute, mData) {
		var oHistory = sap.ui.core.routing.History.getInstance();
		var oPrevHash = oHistory.getPreviousHash();
		if (oPrevHash !== undefined) {
			window.history.go(-1);
		} else if(typeof sRoute == 'undefined') {
			this.navTo("home", {}, true);
		} else {
			this.navTo(sRoute, mData, true);
		}
	},
	/**
	 * @public Changes the view without changing the hash
	 *
	 * @param oOptions {object} must have the following properties
	 * <ul>
	 * 	<li> currentView : the view you start the navigation from.</li>
	 * 	<li> targetViewName : the fully qualified name of the view you want to navigate to.</li>
	 * 	<li> targetViewType : the viewtype eg: XML</li>
	 * 	<li> isMaster : default is false, true if the view should be put in the master</li>
	 * 	<li> transition : default is "show", the navigation transition</li>
	 * 	<li> data : the data passed to the navContainers livecycle events</li>
	 * </ul>
	 */
	myNavToWithoutHash : function (oOptions) {
		var oApp = sap.ui.getCore().byId("idContainer");

		// Load view, add it to the page aggregation, and navigate to it
		var oView = this.getView(oOptions.targetViewName, oOptions.targetViewType);
		oApp.addPage(oView);
		oApp.to(oView.getId(), oOptions.transition || "show", oOptions.data);
	},

	backWithoutHash : function (oCurrentView) {
		this._findApp(oCurrentView, "idContainer").back();
	},

	destroy : function() {
		sap.ui.core.routing.Router.prototype.destroy.apply(this, arguments);
		this._oRouteMatchedHandler.destroy();
	},

	_findApp : function(oControl, sAncestorControlName) {
		if (oControl instanceof sap.ui.core.mvc.View) {
			if (oControl.byId(sAncestorControlName)) {
				return oControl.byId(sAncestorControlName);
			}
		}
		return oControl.getParent() ? this._findApp(oControl.getParent(), sAncestorControlName) : null;

	}
});
