jQuery.sap.declare("view.functions.Library");

// Provides controller functions.Library
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Library = Controller.extend("view.functions.Library", /** @lends view.functions.Library.prototype */ {

    });

    /**
     * On init handler
     */
    Library.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("functions").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Library.prototype.onExit = function() {};

    /**
     * Before rendering, set up required icons
     */
    Library.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Library.prototype.onAfterRendering = function() {;
    };

		/***
		 *    ███╗   ██╗ █████╗ ██╗   ██╗
		 *    ████╗  ██║██╔══██╗██║   ██║
		 *    ██╔██╗ ██║███████║██║   ██║
		 *    ██║╚██╗██║██╔══██║╚██╗ ██╔╝
		 *    ██║ ╚████║██║  ██║ ╚████╔╝
		 *    ╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝
		 *
		 */
		/**
		 * Handles nav back press
		 * @param  {object} oEvent Button press event
		 */
		Library.prototype.onNavBackPress = function(oEvent) {
			this.getRouter().myNavBack("dash");
		};

    /***
     *    ██████╗  ██████╗ ██╗   ██╗████████╗███████╗███████╗
     *    ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔════╝
     *    ██████╔╝██║   ██║██║   ██║   ██║   █████╗  ███████╗
     *    ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ╚════██║
     *    ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗███████║
     *    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚══════╝
     *
     */

    /**
     *
     * @param  {object} oEvent Route matched event
     */
    Library.prototype._onRouteMatched = function(oEvent) {
      this._checkMetaDataLoaded("function");
    };

    return Library;

  }, /* bExport= */ true);
