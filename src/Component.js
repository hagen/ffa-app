jQuery.sap.declare("com.ffa.hpc.Component");
jQuery.sap.require("com.ffa.hpc.MyRouter");
jQuery.sap.require("jquery.sap.storage");

sap.ui.core.UIComponent.extend("com.ffa.hpc.Component", {
  metadata: {
    dependencies: {
      libs: ["sap.m", "sap.ui.layout"],
      components: []
    },
    rootView: "com.ffa.hpc.view.App",
    config: {
      resourceBundle: "i18n/i18n.properties",
      serviceConfig: {
        name: "OData",
        datasetOdataUrl: "/fa/ppo/drop3/xs/services/dataset.xsodata",
        forecastOdataUrl: "/fa/ppo/drop3/xs/services/forecast.xsodata",
        profileOdataUrl: "/fa/ppo/drop3/xs/services/profile.xsodata",
        staticsOdataUrl: "/fa/ppo/drop3/xs/services/static.xsodata",
        functionOdataUrl: "/fa/ppo/drop3/xs/services/function.xsodata",
        vizOdataUrl: "/fa/ppo/drop3/xs/services/viz.xsodata",
      }
    },
    routing: {
      config: {
        routerClass: com.ffa.hpc.MyRouter,
        viewType: "XML",
        viewPath: "com.ffa.hpc.view",
        targetControl: "idContainer",
        targetAggregation: "pages",
        clearTarget: false,
        transition: "slide"
      },
      routes: [{
        pattern: "functions/:function_id:",
        name: "functions",
        view: "com.ffa.hpc.functions.Library",
        viewLevel: 3
      }, {
        pattern: "datasets",
        name: "datasets",
        view: "datasets.DataSets",
        viewLevel: 3,
        subroutes: [{
          pattern: "datasets/hdb/:dataset_id:",
          name: "view-hdb",
          view: "datasets.ViewHDB",
          targetControl: "idDataSetsSplitContainer",
          targetAggregation: "detailPages",
          transition: "slide",
          viewLevel: 4,
          subroutes: [{
            pattern: "datasets/hdb/:dataset_id:/edit",
            name: "edit-hdb",
            view: "datasets.EditHDB",
            transition: "flip",
            viewLevel: 5
          }]
        }, {
          pattern: "datasets/redshift/:dataset_id:",
          name: "view-redshift",
          view: "datasets.ViewRedshift",
          targetControl: "idDataSetsSplitContainer",
          targetAggregation: "detailPages",
          transition: "slide",
          viewLevel: 4,
          subroutes: [{
            pattern: "datasets/redshift/:dataset_id:/edit",
            name: "edit-redshift",
            view: "datasets.EditRedshift",
            transition: "flip",
            viewLevel: 5
          }]
        }, {
          pattern: "datasets/sheets/:dataset_id:",
          name: "view-google", // Do not change - backend needs 'Google'
          view: "datasets.ViewSheets",
          targetControl: "idDataSetsSplitContainer",
          targetAggregation: "detailPages",
          transition: "slide",
          viewLevel: 4,
          subroutes: [{
            pattern: "datasets/sheets/:dataset_id:/edit",
            name: "edit-google", // Do not change - backend needs 'Google'
            view: "datasets.EditSheets",
            transition: "flip",
            viewLevel: 5
          }]
        }, {
          pattern: "datasets/importio/:dataset_id:",
          name: "view-importio",
          view: "datasets.ViewImportIO",
          targetControl: "idDataSetsSplitContainer",
          targetAggregation: "detailPages",
          transition: "slide",
          viewLevel: 4,
          subroutes: [{
            pattern: "datasets/importio/:dataset_id:/edit",
            name: "edit-importio",
            view: "datasets.EditImportIO",
            transition: "flip",
            viewLevel: 5
          }]
        }, {
          pattern: "datasets/new",
          name: "new-dataset",
          view: "datasets.Wizard",
          targetControl: "idDataSetsSplitContainer",
          targetAggregation: "detailPages",
          viewLevel: 4,
          subroutes: [{
            pattern: "datasets/new/redshift",
            name: "redshift",
            view: "datasets.CreateRedshift",
            targetControl: "idContainer",
            targetAggregation: "pages",
            transition: "flip",
            viewLevel: 5
          }, {
            pattern: "datasets/new/sheets",
            name: "sheets",
            view: "datasets.CreateSheets",
            targetControl: "idContainer",
            targetAggregation: "pages",
            transition: "flip",
            viewLevel: 5
          }, {
            pattern: "datasets/new/hana",
            name: "hdb",
            view: "datasets.CreateHDB",
            targetControl: "idContainer",
            targetAggregation: "pages",
            transition: "flip",
            viewLevel: 5
          }, {
            pattern: "datasets/new/importio",
            name: "importio",
            view: "datasets.CreateImportIO",
            targetControl: "idContainer",
            targetAggregation: "pages",
            transition: "flip",
            viewLevel: 5
          }]
        }]
      }, {
        pattern: "workbench",
        name: "workbench",
        view: "forecasts.Workbench",
        viewLevel: 3,
        subroutes: [{
          pattern: "workbench/search",
          name: "search",
          view: "forecasts.Search",
          targetControl: "idWorkbenchSplitContainer",
          targetAggregation: "detailPages",
          viewLevel: 4,
          subroutes: [{
            pattern: "workbench/search/{forecast_id}/:tab:",
            name: "forecast-from-search",
            view: "forecasts.Forecasts",
            targetControl: "idContainer",
            targetAggregation: "pages",
            viewLevel: 5
          }]
        }, {
          pattern: "workbench/recents",
          name: "recents",
          view: "forecasts.Recents",
          targetControl: "idWorkbenchSplitContainer",
          targetAggregation: "detailPages",
          viewLevel: 4,
          subroutes: [{
            pattern: "workbench/recents/{forecast_id}/:tab:",
            name: "forecast-from-recents",
            view: "forecasts.Forecasts",
            targetControl: "idContainer",
            targetAggregation: "pages",
            viewLevel: 5
          }]
        }, {
          pattern: "workbench/folders/:folder_id:",
          name: "folders",
          view: "forecasts.Folders",
          targetControl: "idWorkbenchSplitContainer",
          targetAggregation: "detailPages",
          viewLevel: 4,
          subroutes: [{
            pattern: "workbench/folders/new",
            name: "new-forecast-from-root",
            view: "forecasts.Wizard",
            targetControl: "idWorkbenchSplitContainer",
            targetAggregation: "detailPages",
            viewLevel: 5
          }, {
            pattern: "workbench/folders/:folder_id:/new",
            name: "new-forecast-from-folder",
            view: "forecasts.Wizard",
            targetControl: "idContainer",
            targetAggregation: "pages",
            viewLevel: 5
          }, {
            pattern: "workbench/folders/:folder_id:/forecasts/{forecast_id}/:tab:",
            name: "forecast-from-folder",
            view: "forecasts.Forecasts",
            targetControl: "idContainer",
            targetAggregation: "pages",
            viewLevel: 5
          }]
        }, {
          pattern: "workbench/favorites",
          name: "favorites",
          view: "forecasts.Favorites",
          targetControl: "idWorkbenchSplitContainer",
          targetAggregation: "detailPages",
          viewLevel: 4,
          subroutes: [{
            pattern: "workbench/favorites/{forecast_id}/:tab:",
            name: "forecast-from-favorites",
            view: "forecasts.Forecasts",
            targetControl: "idContainer",
            targetAggregation: "pages",
            viewLevel: 5
          }]
        }, {
          pattern: "workbench/forecasts/{forecast_id}/:tab:",
          name: "forecasts",
          view: "forecasts.Forecasts",
          targetControl: "idContainer",
          targetAggregation: "pages",
          viewLevel: 5
        }]
      }, {
        pattern: "adjust/{forecast_id}/run/{run_id}/:return_route:",
        name: "adjust",
        view: "forecasts.Adjust",
        targetControl: "idContainer",
        targetAggregation: "pages",
        transition: "flip",
        viewLevel: 6
      }, {
        pattern: "rerun/{forecast_id}/:return_route:",
        name: "rerun",
        view: "forecasts.Rerun",
        targetControl: "idContainer",
        targetAggregation: "pages",
        transition: "flip",
        viewLevel: 6
      }, {
        pattern: "settings",
        name: "settings",
        view: "settings.Menu",
        viewLevel: 2,
        subroutes: [{
          pattern: "settings/profile",
          name: "profile",
          view: "settings.Profile",
          transition: "show",
          viewLevel: 3,
          targetControl: "idSettingsSplitContainer",
          targetAggregation: "detailPages"
        }, {
          pattern: "settings/social",
          name: "social",
          view: "settings.Social",
          transition: "show",
          viewLevel: 3,
          targetControl: "idSettingsSplitContainer",
          targetAggregation: "detailPages"
        }, {
          pattern: "settings/account",
          name: "account",
          view: "settings.Account",
          transition: "show",
          viewLevel: 3,
          targetControl: "idSettingsSplitContainer",
          targetAggregation: "detailPages",
          subroutes: [{
            pattern: "settings/account/change",
            name: "change-plan",
            view: "plans.Change",
            viewLevel: 4,
            subroutes: [{
              pattern: "settings/account/change/free",
              name: "change-plan-free",
              view: "plans.Free",
              viewLevel: 5
            }, {
              pattern: "settings/account/change/lite",
              name: "change-plan-lite",
              view: "plans.Paid",
              viewLevel: 5
            }, {
              pattern: "settings/account/change/pro",
              name: "change-plan-pro",
              view: "plans.Paid",
              viewLevel: 5
            }]
          }]
        }, {
          pattern: "settings/support",
          name: "support",
          view: "settings.Support",
          transition: "show",
          viewLevel: 3,
          targetControl: "idSettingsSplitContainer",
          targetAggregation: "detailPages"
        }, {
          pattern: "settings/about",
          name: "about",
          view: "settings.About",
          transition: "show",
          viewLevel: 3,
          targetControl: "idSettingsSplitContainer",
          targetAggregation: "detailPages"
        }]
      }, {
        pattern: "",
        name: "dash",
        view: "Dashboard",
        viewLevel: 2
      }, {
        pattern: "plans",
        name: "plans",
        view: "plans.Plans",
        viewLevel: 2,
        subroutes: [{
          pattern: "plans/free",
          name: "plan-free",
          view: "plans.Free",
          viewLevel: 3
        }, {
          pattern: "plans/lite",
          name: "plan-lite",
          view: "plans.Paid",
          viewLevel: 3
        }, {
          pattern: "plans/pro",
          name: "plan-pro",
          view: "plans.Paid",
          viewLevel: 3
        }, {
          pattern: "plans/enterprise",
          name: "plan-enterprise",
          view: "plans.Enterprise",
          viewLevel: 3
        }]
      }, {
        pattern: "login/:tab:/:reason:",
        name: "login",
        view: "auth.Login",
        viewLevel: 1
      }, {
        pattern: "vr/:tab:/:reason:",
        name: "vr",
        view: "auth.VR",
        viewLevel: 1
      }, {
        pattern: "auth/{provider}/token/{access_token}/:demo:",
        name: "token",
        view: "auth.Token",
        viewLevel: 1
      }, {
        pattern: "noauth/",
        name: "noauth",
        view: "auth.Login",
        viewLevel: 1
      }, {
        pattern: "connect/{provider}/token/{access_token}",
        name: "connect",
        view: "auth.Connect",
        viewLevel: 1
      }, {
        name: "catchallMaster",
        view: "NotFound",
        pattern: ":all*:",
        transition: "show"
      }]
    }
  },
  /**
   * Initialisation
   */
  init: function() {

    sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
    var mConfig = this.getMetadata().getConfig();

    // always use absolute paths relative to our own
    // component (relative paths will fail if running in the Fiori
    // Launchpad)
    var oRootPath = jQuery.sap.getModulePath("com.ffa.hpc");

    // set i18n model
    var i18nModel = new sap.ui.model.resource.ResourceModel({
      bundleUrl: [oRootPath, mConfig.resourceBundle].join("/")
    });
    this.setModel(i18nModel, "i18n");

    // set device model
    var mDeviceModel = new sap.ui.model.json.JSONModel({
      isTouch: sap.ui.Device.support.touch,
      isNoTouch: !sap.ui.Device.support.touch,
      isPhone: sap.ui.Device.system.phone,
      isNoPhone: !sap.ui.Device.system.phone,
      isDesktop: sap.ui.Device.system.desktop,
      isNoDesktop: !sap.ui.Device.system.desktop,
      listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
      listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive"
    });

    mDeviceModel.setDefaultBindingMode("OneWay");
    this.setModel(mDeviceModel, "device");

    // Because we are authenticating against Node first, and this application
    // if effectively stateless (being dependent on API calls), the only plausible
    // means of authentication is through bearer tokens. When the user logs in, they
    // will always have a bearer token accompanying their authenticated redirect, so
    // we'll reuse this token for all subsequent OData calls.
    var oHeaders = {
      Authorization: 'Bearer ' + _token
    };

    /***
     *    ██████╗  █████╗ ████████╗ █████╗ ███████╗███████╗████████╗
     *    ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔════╝██╔════╝╚══██╔══╝
     *    ██║  ██║███████║   ██║   ███████║███████╗█████╗     ██║
     *    ██║  ██║██╔══██║   ██║   ██╔══██║╚════██║██╔══╝     ██║
     *    ██████╔╝██║  ██║   ██║   ██║  ██║███████║███████╗   ██║
     *    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝
     *
     */
    var oDSModel = new sap.ui.model.odata.ODataModel(mConfig.serviceConfig.datasetOdataUrl, {
      headers: oHeaders
    });
    oDSModel.setDefaultBindingMode("OneWay");
    this.setModel(oDSModel, "dataset");

    /***
     *    ███████╗ ██████╗ ██████╗ ███████╗ ██████╗ █████╗ ███████╗████████╗
     *    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗██╔════╝╚══██╔══╝
     *    █████╗  ██║   ██║██████╔╝█████╗  ██║     ███████║███████╗   ██║
     *    ██╔══╝  ██║   ██║██╔══██╗██╔══╝  ██║     ██╔══██║╚════██║   ██║
     *    ██║     ╚██████╔╝██║  ██║███████╗╚██████╗██║  ██║███████║   ██║
     *    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝
     *
     */
    var oFModel = new sap.ui.model.odata.ODataModel(mConfig.serviceConfig.forecastOdataUrl, {
      headers: oHeaders
    });
    oFModel.setDefaultBindingMode("TwoWay");
    this.setModel(oFModel, "forecast");

    /***
     *    ██████╗ ██████╗  ██████╗ ███████╗██╗██╗     ███████╗
     *    ██╔══██╗██╔══██╗██╔═══██╗██╔════╝██║██║     ██╔════╝
     *    ██████╔╝██████╔╝██║   ██║█████╗  ██║██║     █████╗
     *    ██╔═══╝ ██╔══██╗██║   ██║██╔══╝  ██║██║     ██╔══╝
     *    ██║     ██║  ██║╚██████╔╝██║     ██║███████╗███████╗
     *    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚══════╝
     *
     */
    var oPModel = new sap.ui.model.odata.ODataModel(mConfig.serviceConfig.profileOdataUrl, {
      headers: oHeaders
    });
    oPModel.setDefaultBindingMode("TwoWay");
    this.setModel(oPModel, "profile");

    /***
     *    ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗
     *    ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║
     *    █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║
     *    ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║
     *    ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║
     *    ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     *
     */

    var oFuncModel = new sap.ui.model.odata.ODataModel(mConfig.serviceConfig.functionOdataUrl, {
      headers: oHeaders
    });
    oFuncModel.setDefaultBindingMode("OneWay");
    this.setModel(oFuncModel, "function");

    /***
     *    ███████╗████████╗ █████╗ ████████╗██╗ ██████╗███████╗
     *    ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║██╔════╝██╔════╝
     *    ███████╗   ██║   ███████║   ██║   ██║██║     ███████╗
     *    ╚════██║   ██║   ██╔══██║   ██║   ██║██║     ╚════██║
     *    ███████║   ██║   ██║  ██║   ██║   ██║╚██████╗███████║
     *    ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝╚══════╝
     *
     */

    var oSModel = new sap.ui.model.odata.ODataModel(mConfig.serviceConfig.staticsOdataUrl, {
      headers: oHeaders
    });
    oSModel.setDefaultBindingMode("OneWay");
    oSModel.setSizeLimit(300);
    this.setModel(oSModel, "static");

    /***
     *    ██╗   ██╗██╗███████╗
     *    ██║   ██║██║╚══███╔╝
     *    ██║   ██║██║  ███╔╝
     *    ╚██╗ ██╔╝██║ ███╔╝
     *     ╚████╔╝ ██║███████╗
     *      ╚═══╝  ╚═╝╚══════╝
     *
     */

    var oVizModel = new sap.ui.model.odata.ODataModel(mConfig.serviceConfig.vizOdataUrl, {
      headers: oHeaders
    });
    oSModel.setDefaultBindingMode("TwoWay");
    this.setModel(oVizModel, "viz");

    /***
     *    ██╗   ██╗███████╗███████╗██████╗
     *    ██║   ██║██╔════╝██╔════╝██╔══██╗
     *    ██║   ██║███████╗█████╗  ██████╔╝
     *    ██║   ██║╚════██║██╔══╝  ██╔══██╗
     *    ╚██████╔╝███████║███████╗██║  ██║
     *     ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝
     *
     */

    jQuery.ajax({
      url: 'auth/api/user',
      type: 'GET',
      headers: oHeaders,
      async: false,
      success: jQuery.proxy(function(data) {
        var oUModel = new sap.ui.model.json.JSONModel(data);
        oUModel.setDefaultBindingMode("OneWay");
        this.setModel(oUModel, "user");
      }, this)
    })

    /***
     *    ███████╗███╗   ██╗██╗   ██╗
     *    ██╔════╝████╗  ██║██║   ██║
     *    █████╗  ██╔██╗ ██║██║   ██║
     *    ██╔══╝  ██║╚██╗██║╚██╗ ██╔╝
     *    ███████╗██║ ╚████║ ╚████╔╝
     *    ╚══════╝╚═╝  ╚═══╝  ╚═══╝
     *
     */

    var oUrlModel = new sap.ui.model.json.JSONModel("env/settings.json");
    oUrlModel.setDefaultBindingMode("OneWay");
    this.setModel(oUrlModel, "env");

    this.getRouter().initialize();
  },

  /**
   * Destroy component?
   */
  destroy: function() {
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
  createContent: function() {

    // create root view
    var oView = sap.ui.view({
      id: "idRootView",
      height: "100%", // Man this is SOOO important (only spent 2 hours figuring out)
      viewName: "com.ffa.hpc.view.App",
      type: "JS",
      viewData: {
        component: this
      }
    });

    // done
    return oView;
  }
});
