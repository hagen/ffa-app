jQuery.sap.declare("com.ffa.hpc.view.datasets.ViewController");

// Provides controller com.ffa.hpc.util.Controller
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/datasets/Controller"],
  function(jQuery, DataController) {
    "use strict";

    var Controller = DataController.extend("com.ffa.hpc.view.datasets.ViewController", /** @lends com.ffa.hpc.view.datasets.ViewController */ {

    });

    /***
     *    ██████╗ ███████╗███████╗██╗███╗   ██╗██╗████████╗██╗ ██████╗ ███╗   ██╗
     *    ██╔══██╗██╔════╝██╔════╝██║████╗  ██║██║╚══██╔══╝██║██╔═══██╗████╗  ██║
     *    ██║  ██║█████╗  █████╗  ██║██╔██╗ ██║██║   ██║   ██║██║   ██║██╔██╗ ██║
     *    ██║  ██║██╔══╝  ██╔══╝  ██║██║╚██╗██║██║   ██║   ██║██║   ██║██║╚██╗██║
     *    ██████╔╝███████╗██║     ██║██║ ╚████║██║   ██║   ██║╚██████╔╝██║ ╚████║
     *    ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     *
     */

    /**
     * On press, first check if we're in edit mode, and then display the definition
     * listing pop-up.
     * @param  {Event} oEvent Link press event
     */
    Controller.prototype.onDefinitionLinkPress = function(oEvent) {
      // If we're not in edit mode, then display a little reminder to get into edit
      // mode first.
      this.showInfoAlert("Before you can edit the data set definition types, you'll need to enter edit mode...", "Edit definition", sap.ui.Device.system.phone);
    };
  });
