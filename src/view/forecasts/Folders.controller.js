jQuery.sap.declare("com.ffa.hpc.view.forecasts.Folders");
jQuery.sap.require("sap.m.MessageBox");

// Provides controller forecasts.Folders
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/forecasts/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Folders = Controller.extend("com.ffa.hpc.view.forecasts.Folders", /** @lends com.ffa.hpc.view.forecasts.Folders.prototype */ {

    });

    /**
     * On init handler
     */
    Folders.prototype.onInit = function() {
      // Our folder Id globals
      this._sFolderId = "";

      // handle route matched
      this.getRouter().getRoute("folders").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Folders.prototype.onExit = function() {};

    /**
     * Before rendering, set up required icons
     */
    Folders.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Folders.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler
     * @param  {object} oEvent Route matched event
     */
    Folders.prototype._onRouteMatched = function(oEvent) {
      this.checkMetaDataLoaded("forecast");

      // Let the master list know I'm on this Folders view.
      this.getEventBus().publish("Folders", "RouteMatched", {} /* payload */ );

      var oParameters = oEvent.getParameters();
      this._sFolderId = (oParameters.arguments.folder_id ? oParameters.arguments.folder_id : "");

      // Show the folder page...
      this._showFoldersForecasts();
    };

    /**
     * Show either or
     * @return {[type]} [description]
     */
    Folders.prototype._showFoldersForecasts = function() {

      var bVisible = false;
      var oTileContainer = this.getView().byId("idFoldersTileContainer");

      // get the folders list and load up the correct folder listing.
      var oTemplate = new sap.m.StandardTile({
        icon: "{= ${forecast>type} === 'folder' ? 'sap-icon://folder-blank' : 'sap-icon://line-chart' }",
        title: "{forecast>name}",
        info: "{forecast>DataSet/name}",
        number: "{= ${forecast>horizon} === 0 ? ' ' : ${forecast>horizon} }",
        numberUnit: "{= ${forecast>horizon} === 0 ? ' ' : ${forecast>horizon} === 1 ? 'day' : 'days' }",
        type: sap.m.StandardTileType.None,
        press: jQuery.proxy(this.onTilePress, this) // be careful with this template
          // press event - you must wrap in Proxy, otherwise
          // this refers to the tile.
      });

      // If the folder Id is populated, we need to go to the forecast page in our
      // nav container.
      if (!this._sFolderId) {
        if (this._hasTopLevel()) {
          this._showFoldersPage(
            this.getView().byId("idFoldersNavContainer") /* nav container */ ,
            this.getView().byId("idFoldersPage") /* root page */ ,
            this.getView().byId("idFoldersTileContainer") /* tile container */ ,
            oTemplate
          );
          // hide message page
          bVisible = false;
        } else {
          // Show the no forecasts page
          bVisible = true;
        }

        // Message page
        var oMessagePage = this.getView().byId("idFoldersMessagePage");
        oMessagePage.setVisible(bVisible);
        oTileContainer.setVisible(!bVisible);
      } else {
        this._showForecastsPage(
          this.getView().byId("idFoldersNavContainer") /* nav container */ ,
          this.getView().byId("idForecastsPage") /* root page */ ,
          this.getView().byId("idForecastsTileContainer") /* tile container */ ,
          oTemplate,
          this._sFolderId
        );
      }
    };

    /**
     * To test for top-level documents, we must filter on both the username
     * and on the parent_id. Remember, the username will be populated in the
     * proxy server.
     * @return {Boolean} [description]
     */
    Folders.prototype._hasTopLevel = function() {
      var aFilters = [new sap.ui.model.Filter({
        path: "endda",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: "9999-12-31"
      }), new sap.ui.model.Filter({
        path: "parent_id",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: "" // must be blank for top-level Documents
      }), new sap.ui.model.Filter({
        path: "user",
        operator: sap.ui.model.FilterOperator.EQ,
        value1: "TESTUSER" // this will be replaced in reverse proxy
      })];

      // now call the documents query, and return its result
      return this.hasDocuments(aFilters);
    };

    /**
     * [function description]
     * @param  {[type]} oNav           [description]
     * @param  {[type]} oPage          [description]
     * @param  {[type]} oTileContainer [description]
     * @param  {[type]} oTemplate      [description]
     * @return {[type]}                [description]
     */
    Folders.prototype._showFoldersPage = function(oNav, oPage, oTileContainer, oTemplate) {
      if (!oTileContainer.getElementBinding()) {
        oTileContainer.bindAggregation("tiles", {
          path: "forecast>/Documents",
          parameters: {
            expand: "DataSet"
          },
          sorter: [new sap.ui.model.Sorter({
            path: "type",
            descending: false,
            group: false
          }), new sap.ui.model.Sorter({
            path: "name",
            descending: false,
            group: false
          })],
          filters: [new sap.ui.model.Filter({
            path: "endda",
            operator: sap.ui.model.FilterOperator.GT,
            value1: new Date()
          }), new sap.ui.model.Filter({
            path: "parent_id",
            operator: sap.ui.model.FilterOperator.EQ,
            value1: "" // must be blank for top-level Documents
          }), new sap.ui.model.Filter({
            path: "user",
            operator: sap.ui.model.FilterOperator.EQ,
            value1: "TESTUSER" // this will be replaced in reverse proxy
          })],
          template: oTemplate
        });
      }

      // If the nav is not on this page, then nav...
      if (oNav.getCurrentPage() !== oPage) {
        oNav.backToPage(oPage);
      }
    };

    /**
     * [function description]
     * @param  {object} oNav           [description]
     * @param  {[type]} oPage          [description]
     * @param  {[type]} oTileContainer [description]
     * @param  {[type]} oTemplate      [description]
     * @param  {[type]} sFolderId      [description]
     * @return {[type]}                [description]
     */
    Folders.prototype._showForecastsPage = function(oNav, oPage, oTileContainer, oTemplate, sFolderId) {
      // Bind page to folder...
      oPage.bindElement("forecast>/Folders('" + sFolderId + "')");

      // Bind tile container. For forecasts, always unbind.
      oTileContainer.bindAggregation("tiles", {
        path: "forecast>/Documents",
        parameters: {
          expand: "DataSet"
        },
        sorter: [new sap.ui.model.Sorter({
          path: "name",
          descending: false,
          group: false
        })],
        filters: [new sap.ui.model.Filter({
          path: "endda",
          operator: sap.ui.model.FilterOperator.GT,
          value1: new Date()
        }), new sap.ui.model.Filter({
          path: "parent_id",
          operator: sap.ui.model.FilterOperator.EQ,
          value1: sFolderId
        }), new sap.ui.model.Filter({
          path: "user",
          operator: sap.ui.model.FilterOperator.EQ,
          value1: this.getUserId() // this will be replaced in reverse proxy
        })],
        template: oTemplate
      });

      // If the nav is not on this page, then nav...
      if (oNav.getCurrentPage() !== oPage) {
        oNav.to(oPage);
      }
    };

    /**
     * Handles nav back press
     * @param  {object} oEvent Button press event
     */
    Folders.prototype.onNavBackPress = function(oEvent) {
      this.getRouter().myNavBack("workbench");
    };

    /**
     * When the user hits the nav back/up button, they are navigating back up
     * the folder structure... note, when you are at the root, you cannot nav
     * back (the button will be disabled)
     * @param  {object} oEvent Button press event
     */
    Folders.prototype.onFolderUpPress = function(oEvent) {
      // Nav back to root
      this.getRouter().navTo("folders", {}, !sap.ui.Device.system.phone);
    };

    /***
     *    ███████╗ ██████╗ ██╗     ██████╗ ███████╗██████╗ ███████╗
     *    ██╔════╝██╔═══██╗██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
     *    █████╗  ██║   ██║██║     ██║  ██║█████╗  ██████╔╝███████╗
     *    ██╔══╝  ██║   ██║██║     ██║  ██║██╔══╝  ██╔══██╗╚════██║
     *    ██║     ╚██████╔╝███████╗██████╔╝███████╗██║  ██║███████║
     *    ╚═╝      ╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝
     *
     */

    /**
     * When the edit button is pressed, the tiles go into edit/delete mode.
     * Note, because there are two screens with forecasts/folders displayed, we
     * need to pick the currently displayed page, and then pick the correct
     * tile container.
     * @param  {[type]} oEvent [description]
     */
    Folders.prototype.onFoldersEditPress = function(oEvent) {
      var oButton = oEvent.getSource();
      var oModel = this.getView().getModel("forecast");

      // If we are going into edit mode, then we need to make the tile container
      // editable...
      var oTileContainer = this.getView().byId("idFoldersTileContainer");
      oTileContainer.setEditable(true);

      // set the back/up button, to be disabled
      this.getView().byId("idFoldersPage").setShowNavButton(false);

      // set the add new button to be disabled
      this.getView().byId("idNewFolderButton").setEnabled(false);

      // Update the button text, and press handler. It now responds to Done
      oButton.setText("Done");
      oButton.detachPress(this.onFoldersEditPress, this)
        .attachPress(this.onFoldersDonePress, this);
    };

    /**
     * On press of the done button, we will save the deletions and return to normal mode
     * @param  {[type]} oEvent [description]
     */
    Folders.prototype.onFoldersDonePress = function(oEvent) {
      var oButton = oEvent.getSource();
      var oModel = this.getView().getModel("forecast");

      // If we are going into edit mode, then we need to make the tile container
      // editable...
      var oTileContainer = this.getView().byId("idFoldersTileContainer");
      oTileContainer.setEditable(false);

      // set the back/up button, to be disabled
      this.getView().byId("idFoldersPage").setShowNavButton(this.getView().getModel("device").getProperty("/isPhone"));

      // set the add new button to be disabled
      this.getView().byId("idNewFolderButton").setEnabled(true);

      // Update the button text, and press handler. It now responds to Done
      oButton.setText("Edit");
      oButton.detachPress(this.onFoldersDonePress, this)
        .attachPress(this.onFoldersEditPress, this);

      // and handle the deletions?
      oModel.addBatchChangeOperations(this._aBatchOps);
      oModel.submitBatch(jQuery.proxy(function() {
          sap.m.MessageToast.show("Items deleted");
          this._aBatchOps = [];
        }, this),
        jQuery.proxy(function() {
          sap.m.MessageToast.show("Error deleting items");
        }, this),
        true /* bImport */ );
    };

    /**
     * Simulates press of the folders/forecasts add button
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Folders.prototype.onFoldersLinkPress = function(oEvent) {
      // Fire the button press event for the add button
      this.getView().byId("idNewFolderButton").firePress();
    };

    /**
     * Handles press of the New folder/forecast button
     * @param  {object} oEvent Button press event
     */
    Folders.prototype.onFoldersAddPress = function(oEvent) {
      // We need to get our add new actionsheet if not already initialised
      if (!this._oNewActionSheet) {
        this._oNewActionSheet = sap.ui.xmlfragment("idNewFolderForecastFragment", "com.ffa.hpc.view.forecasts.NewFolderForecastActionSheet", this);
        this.getView().addDependent(this._oNewActionSheet);
      }

      // open the popover
      this._oNewActionSheet.openBy(oEvent.getSource());
    };

    /**
     * Handles press of the New folder button from our 'new something' action sheet
     * @param  {object} oEvent Button press event
     */
    Folders.prototype.onNewFolderPress = function(oEvent) {
      // Initialise the new folder dialog fragment, if not already available
      if (!this._oNewFolderDialog) {
        this._oNewFolderDialog = sap.ui.xmlfragment("idNewFolderFragment", "com.ffa.hpc.view.forecasts.NewFolderDialog", this);
        this.getView().addDependent(this._oNewFolderDialog);
      }

      // open the new folder dialog
      this._oNewFolderDialog.open();
    };

    /**
     * Handles press of the new folder Cancel button. That is, the user wishes to Cancel
     * the creation of a new folder. Close the dialog and clear the input field value
     * @param  {object} oEvent Button press event
     */
    Folders.prototype.onNewFolderCancelPress = function(oEvent) {
      // Clear the folder name input field
      sap.ui.core.Fragment.byId("idNewFolderFragment", "idNewFolderNameInput").setValue("");

      // open the new folder dialog
      this._oNewFolderDialog.close();
    };

    /**
     * Handles press of the New forecast button from our 'new something' action sheet
     * @param  {object} oEvent Button press event
     */
    Folders.prototype.onNewFolderCreatePress = function(oEvent) {
      jQuery.sap.require("com.ffa.hpc.thirdparty.shortid.ShortId");

      // Make sure there is a value and it doesn't contain anything stupid
      var oInput = sap.ui.core.Fragment.byId("idNewFolderFragment", "idNewFolderNameInput");

      // Take first 120 chars and trim
      var sName = oInput.getValue().substring(0, 119).trim();

      // if emtpy, raise an error on the input
      if (sName === "") {
        oInput.setValueState(sap.ui.core.ValueState.Warning);
        oInput.setValueStateText("No name provided... click 'Create' again to use default");
        oInput.setValue("New folder"); // Localisation required
        return;
      }

      // Set folder list to busy
      var oList = this.getView().byId("idFoldersMasterForecastList");

      // Payload contains uid, name and f it's a subfolder, it'll have a parent id...
      var oData = {
        id: ShortId.generate(10),
        parent_id: "",
        name: sName,
        created: new Date(0),
        begda: new Date(0),
        endda: "9999-12-31",
        user: this.getUserId()
      };

      // The current folder becomes our parent
      if (this._sFolderId) {
        oData.parent_id = this._sFolderId;
      }

      // Create the folder...
      this.getView().getModel("forecast").create("/Folders", oData, {
        success: jQuery.proxy(function(oData, mResponse) {
          // Rebind the tile container.
          var oTileContainer = this.getView().byId("idFoldersTileContainer");
          var oBinding = oTileContainer.getBinding("tiles");
          if (oBinding) {
            oBinding.refresh();
          } else {
            this._showFoldersForecasts();
          }
        }, this),
        error: jQuery.proxy(function(mResponse) {
          jQuery.sap.require("sap.m.MessageBox");

          // Error message
          var sMessage = "Creating folder failed.";
          sap.m.MessageBox.alert(sMessage, {
            icon: sap.m.MessageBox.Icon.ERROR,
            title: "Folder error",
            actions: [sap.m.MessageBox.Action.CLOSE]
          });
        }, this),
        async: true
      });

      // and finally, close the dialog so everything can refresh.
      this.onNewFolderCancelPress(null);
    };

    /***
     *    ███████╗ ██████╗ ██████╗ ███████╗ ██████╗ █████╗ ███████╗████████╗███████╗
     *    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝
     *    █████╗  ██║   ██║██████╔╝█████╗  ██║     ███████║███████╗   ██║   ███████╗
     *    ██╔══╝  ██║   ██║██╔══██╗██╔══╝  ██║     ██╔══██║╚════██║   ██║   ╚════██║
     *    ██║     ╚██████╔╝██║  ██║███████╗╚██████╗██║  ██║███████║   ██║   ███████║
     *    ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * When the edit button is pressed, the tiles go into edit/delete mode.
     * Note, because there are two screens with forecasts/folders displayed, we
     * need to pick the currently displayed page, and then pick the correct
     * tile container.
     * @param  {[type]} oEvent [description]
     */
    Folders.prototype.onForecastsEditPress = function(oEvent) {
      var oButton = oEvent.getSource();
      var oModel = this.getView().getModel("forecast");

      // If we are going into edit mode, then we need to make the tile container
      // editable...
      var oTileContainer = this.getView().byId("idForecastsTileContainer");
      oTileContainer.setEditable(true);

      // set the back/up button, to be disabled
      this.getView().byId("idForecastsPage").setShowNavButton(false);

      // set the add new button to be disabled
      this.getView().byId("idNewForecastButton").setEnabled(false);

      // Update the button text, and press handler. It now responds to Done
      oButton.setText("Done");
      oButton.detachPress(this.onForecastsEditPress, this)
        .attachPress(this.onForecastsDonePress, this);
    };

    /**
     * On press of the done button, we will save the deletions and return to normal mode
     * @param  {[type]} oEvent [description]
     */
    Folders.prototype.onForecastsDonePress = function(oEvent) {
      var oButton = oEvent.getSource();
      var oModel = this.getView().getModel("forecast");

      // If we are going into edit mode, then we need to make the tile container
      // editable...
      var oTileContainer = this.getView().byId("idForecastsTileContainer");
      oTileContainer.setEditable(false);

      // set the back/up button, to be disabled
      this.getView().byId("idForecastsPage").setShowNavButton(true);

      // set the add new button to be disabled
      this.getView().byId("idNewForecastButton").setEnabled(true);

      // Update the button text, and press handler. It now responds to Done
      oButton.setText("Edit");
      oButton.detachPress(this.onForecastsDonePress, this)
        .attachPress(this.onForecastsEditPress, this);

      // and handle the deletions?
      oModel.addBatchChangeOperations(this._aBatchOps);
      oModel.submitBatch(jQuery.proxy(function() {
          sap.m.MessageToast.show("Items deleted");
          this._aBatchOps = [];
        }, this),
        jQuery.proxy(function() {
          sap.m.MessageToast.show("Error deleting items");
        }, this),
        true /* bImport */ );
    };

    /**
     * Handles press of the New forecast button. Essentially, we're just navigating
     * to the New Forecast Wizard, but retaining the folder route for backwards
     * navigation.
     * @param  {object} oEvent Button press event
     */
    Folders.prototype.onNewForecastPress = function(oEvent) {
      this.getRouter().navTo("new-forecast-from-folder", {
        folder_id: (this._sFolderId ? this._sFolderId : "")
      }, !sap.ui.Device.system.phone);
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
     * Folder/forecast tile is pressed. Time to navigate!
     * @param  {object} oEvent The tile press event
     */
    Folders.prototype.onTilePress = function(oEvent) {
      // Grab the tile so we can get it's type and id
      var oTile = oEvent.getSource();
      var oContext = oTile.getBindingContext("forecast");
      var sId = oContext.getProperty("id");

      // If this is another folder, then we are navigating to another folder
      switch (oContext.getProperty("type")) {
        case "folder":
          this.getRouter().navTo("folders", {
            folder_id: sId
          }, !sap.ui.Device.system.phone);
          break;
        case "forecast":
          this.getRouter().navTo("forecast-from-folder", {
            forecast_id: sId
          }, !sap.ui.Device.system.phone);
          break;
      }
    };

    /**
     * Tile is deleted. Yikes. We should probably check that this is what
     * the user wants to do!!!
     * @param  {object} oEvent The tile delete event
     */
    Folders.prototype.onTileDelete = function(oEvent) {
      // Grab the tile so we can get it's type and id
      var oTile = oEvent.getParameter("tile");
      var oTileContainer = oTile.getParent();
      var oContext = oTile.getBindingContext("forecast");
      var sTitle = "";
      var sMessage = "";
      var sPath = "";
      var that = this;

      // If this is another folder, then we are navigating to another folder
      if (oContext.getProperty("type") === "folder") {

        sPath = "/Folders('" + oContext.getProperty("id") + "')";
        sTitle = "Delete folder";
        sMessage = "Deleting a folder is permanent, and will delete " +
          "all forecasts within the folder. Continue?";
      } else if (oContext.getProperty("type") === "forecast") {

        sPath = "/Forecasts('" + oContext.getProperty("id") + "')";
        sTitle = "Delete forecast";
        sMessage = "Deleting a forecast is permanent... Continue?";
      }

      // Show message box
      sap.m.MessageBox.show(sMessage, {
        icon: sap.m.MessageBox.Icon.WARNING,
        title: sTitle,
        actions: [sap.m.MessageBox.Action.CANCEL, sap.m.MessageBox.Action.YES],
        onClose: function(oAction) {
          if (oAction === sap.m.MessageBox.Action.YES) {
            // Mark this tile for deletion.
            that._aBatchOps.push(oContext.getModel("forecast").createBatchOperation(sPath, "DELETE"));
            oTileContainer.removeTile(oTile);
          }
        }
      });
    };

    return Folders;

  }, /* bExport= */ true);
