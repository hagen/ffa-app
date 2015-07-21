jQuery.sap.declare("com.ffa.dash.Component");
jQuery.sap.require("com.ffa.dash.MyRouter");

sap.ui.core.UIComponent.extend("com.ffa.dash.Component",{
	metadata : {
		dependencies : {
			libs : [ "sap.m", "sap.ui.layout" ],
			components : []
		},
		rootView : "com.ffa.dash.view.App",
		config : {
			resourceBundle : "i18n/i18n.properties",
			serviceConfig : {
				name : "OData",
				//serviceUrl : "http://hana.forefrontanalytics.com.au/fa/ppo/build/xs/services/odata.xsodata"
			}
		},
		routing : {
			config : {
				routerClass : com.ffa.dash.MyRouter,
				viewType : "XML",
				viewPath : "view",
				targetControl : "idContainer",
				targetAggregation: "pages",
				clearTarget : false,
				transition : "slide"
			},
			routes : [ {
				pattern : "",
				name : "home",
				view : "Home",
				viewLevel: 1
			},{
				name : "catchallMaster",
				view : "NotFound",
				subroutes : [ {
					pattern : ":all*:",
					name : "catchallDetail",
					view : "NotFound",
					transition : "show"
				} ]
			} ]
		}
	},
	/**
	 * Initialisation
	 */
	init : function() {

		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
		var mConfig = this.getMetadata().getConfig();

		// always use absolute paths relative to our own
		// component (relative paths will fail if running in the Fiori
		// Launchpad)
		var oRootPath = jQuery.sap.getModulePath("com.ffa.dash");

		// set i18n model
		var i18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl : [ oRootPath, mConfig.resourceBundle ].join("/")
		});
		this.setModel(i18nModel, "i18n");

		// set device model
		var mDeviceModel = new sap.ui.model.json.JSONModel({
			isTouch : sap.ui.Device.support.touch,
			isNoTouch : !sap.ui.Device.support.touch,
			isPhone : sap.ui.Device.system.phone,
			isNoPhone : !sap.ui.Device.system.phone,
			isDesktop : sap.ui.Device.system.desktop,
			isNoDesktop : !sap.ui.Device.system.desktop,
			listMode : sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
			listItemType : sap.ui.Device.system.phone ? "Active" : "Inactive"
		});

		mDeviceModel.setDefaultBindingMode("OneWay");
		this.setModel(mDeviceModel, "device");

		// var sServiceUrl = mConfig.serviceConfig.serviceUrl;
    //
		// // Create and set domain model to the component
		// var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl);
		// oModel.setDefaultBindingMode("OneWay");

		// We are dealing with data over one year in size, so we need extra days
		// oModel.setSizeLimit(500);
		// this.setModel(oModel);

		this.getRouter().initialize();
	},
	/**
	 * Destroy component?
	 */
	destroy : function() {
		if (this._routeHandler) {
			this._routeHandler.destroy();
		}

		// call overriden destroy
		sap.ui.core.UIComponent.prototype.destroy.apply(this, arguments);
	},
	/**
	 * Create initial JS view - this is a wrapper that will return an embedded
	 * SplitApp
	 */
	createContent : function() {

		// create root view
		var oView = sap.ui.view({
			id : "idRootView",
			height : "100%", // Man this is SOOO important (only spent 2 hours figuring out)
			viewName : "view.App",
			type: "JS",
			viewData : {
				component : this
			}
		});

		// done
		return oView;
	}
});
