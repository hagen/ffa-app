jQuery.sap.declare("view.data.DataSets");

// Provides controller view.DataSets
sap.ui.define(['jquery.sap.global', 'view/data/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var DataSets = Controller.extend("view.data.DataSets", /** @lends view.data.DataSets.prototype */ {

      /**
       * Batch operations
       * @type {Array}
       */
      _aBatchOps: []
    });

    /**
     * On init handler
     */
    DataSets.prototype.onInit = function() {

      // Deferred promise tells us when the master list is loaded.
      this._oMasterLoadedPromise = jQuery.Deferred();

      // If we're on a phone, immediately resolve, as we don't have to wait for
      // the master to load before showing the detail.
      if (sap.ui.Device.system.phone) {
        //don't wait for the master on a phone
        this._oMasterLoadedPromise.resolve();
      } else {
        this.getView().byId("idDataSetMasterList").attachEventOnce("updateFinished", function() {
          this._oMasterLoadedPromise.resolve();
        }, this);
      }

      // Listen for events
      this.getEventBus().subscribe("Detail", "RefreshMaster", this.handleListRefresh, this);

      // handle route matched
      this.getRouter().getRoute("datasets").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    DataSets.prototype.onExit = function() {};

    /**
     * Before rendering, set up required icons
     */
    DataSets.prototype.onBeforeRendering = function() {
      // Set up some cool icons
    };

    /**
     *
     */
    DataSets.prototype.onAfterRendering = function() {;
    };

    /***
     *    ██████╗  ██████╗ ██╗   ██╗████████╗███████╗
     *    ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝
     *    ██████╔╝██║   ██║██║   ██║   ██║   █████╗
     *    ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝
     *    ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗
     *    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝
     *
     */

    /**
     * Route matched handler...
     * When matching the route of a data set, we only need to know the data set
     * Id in order to figure out what type of dataset it is.
     */
    DataSets.prototype._onRouteMatched = function(oEvent) {
      this._checkMetaDataLoaded("dataset");
      var oParameters = oEvent.getParameters();

      // The dataset ID may not have been provided. If not, that's cool
      if (oParameters.arguments.dataset_id) {
        // retain the data set id
        this._sId = oParameters.arguments.dataset_id;

        // and open up the detail page
        this.showDetail(this._sId);
      } else {
        this._sId = null;

        // nav to message page and return
        var oSplitContainer = this.getView().byId("idDataSetsSplitContainer");
        var oMessagePage = this.getView().byId("idDataSetsMessagePage");

        // We're not on a phone, so show the detail page
        if (!sap.ui.Device.system.phone) {
          oSplitContainer.toDetail(oMessagePage);
        }
      }
    };

    /**
     * Handles nav back press
     * @param  {object} oEvent Button press event
     */
    DataSets.prototype.onNavBackPress = function(oEvent) {
      this.getRouter().myNavBack("dash");
    };

    /***
     *    ██╗     ██╗███████╗████████╗
     *    ██║     ██║██╔════╝╚══██╔══╝
     *    ██║     ██║███████╗   ██║
     *    ██║     ██║╚════██║   ██║
     *    ███████╗██║███████║   ██║
     *    ╚══════╝╚═╝╚══════╝   ╚═╝
     *
     */


    /**
     * When the master list is loaded, we can load up the detail view by resolving
     * the deferred promise set up in init
     * @param  {string} sChannel Event channel
     * @param  {string} sEvent   Event name
     * @param  {object} oData    Event payload
     */
    DataSets.prototype.onMasterListLoaded = function(sChannel, sEvent, oData) {
      this.getView().setBusy(false);
      this._oMasterLoadedPromise.resolve();
    };

    /**
     * Handles refresh of the master list
     * @param  {string} sChannel Event channel
     * @param  {string} sEvent   Event name
     * @param  {object} oData    Event payload
     */
    DataSets.prototype.handleListRefresh = function(sChannel, sEvent, oData) {
      var oList = this.getView().byId('idDataSetMasterList');
      var binding = oList.getBinding("items");
      binding.refresh();
    };

    /**
     * Opens the detail page for the data set id
     * @param  {String} sId The data set id to open
     */
    DataSets.prototype.showDetail = function(sId) {
      // What's the path?
      var sPath = "/DataSets('" + sId + "')";
      var oParams = {
        expand: "Dimensions"
      };

      // wait for the master list to have loaded.
      jQuery.when(this._oMasterLoadedPromise).then(jQuery.proxy(function() {
        // Now that we have the Id, determine the type of view required
        var oData = this.getView().getModel("dataset").getProperty(sPath);
        var sSource = jQuery.sap.charToUpperCase(oData.type_id, 0);
        var sDetailPageId = "idDataSetDetailPage" + sSource;

        // Bind the view to the data set Id
        var oPage = this.getView().byId(sDetailPageId);
        oParams.expand += "," + sSource;

        // Bind the destination page with the path and expand params
        oPage.bindElement("dataset>" + sPath, oParams);

        // and do the split container nav
        var oSplitContainer = this.getView().byId("idDataSetsSplitContainer");
        oSplitContainer.toDetail(oPage);

        // And we may also need to select the master list item, if we
        // navigated here without using the list.
        this.maybeSelectMasterListItem(sPath);
      }, this));
    };

    /**
     * If the list doesn't have the correct item selected, then we need
     * to select it; this is for instances where the master list wasn't used
     * for navigation - rather, the user navigated with a URL
     * @param  {string} sPath Path to check selected item against
     */
    DataSets.prototype.maybeSelectMasterListItem = function(sPath) {
      var oList = this.getView().byId("idDataSetMasterList");
      var aItems = oList.getItems();

      for (var i = 0; i < aItems.length; i++) {
        // Because we're using grouping, be careful not to request bindingPath from
        // a group header. Do an instance check.
        if (aItems[i] instanceof sap.m.StandardListItem) {
          if (aItems[i].getBindingContext("dataset").getPath() === sPath) {
            // Because we're single select, selecting this item will deselect
            // all others.
            if (!aItems[i].getSelected()) {
              aItems[i].setSelected(true);
              break;
            }
          }
        }
      }
    };

    /**
     * Returns a List item grouping, for the datasets list
     * @param  {object} oGroup The object group, as identified by the list
     *                         binding parameters
     */
    DataSets.prototype.getDataSetGroupHeader = function(oGroup) {
      return new sap.m.GroupHeaderListItem({
        title: oGroup.key,
        upperCase: false
      });
    };

    /**
     * When any of the list items are pressed, event is fired. We are navigating
     * to the configuration detail screen of the selected data source.
     * @param  {object} oEvent Item pressed event
     */
    DataSets.prototype.onListItemPress = function(oEvent) {

      let oList = oEvent.getSource();
      let oItem = oEvent.getParameter("listItem");

      // If the oItem is already selected, then don't re-select/and re navigate
      if (oItem.getBindingContext("dataset").getProperty("id") === this._sId) {
        return;
      }

      // Otherwise, we need to navigate to the correct detail view for the selected
      // data source. Start by determining the data source type /DataSource/Source
      this.getRouter().navTo("datasets", {
        dataset_id: oItem.getBindingContext("dataset").getProperty("id")
      }, !sap.ui.Device.system.phone);
    };

    /***
     *    ██████╗ ██╗   ██╗████████╗████████╗ ██████╗ ███╗   ██╗███████╗
     *    ██╔══██╗██║   ██║╚══██╔══╝╚══██╔══╝██╔═══██╗████╗  ██║██╔════╝
     *    ██████╔╝██║   ██║   ██║      ██║   ██║   ██║██╔██╗ ██║███████╗
     *    ██╔══██╗██║   ██║   ██║      ██║   ██║   ██║██║╚██╗██║╚════██║
     *    ██████╔╝╚██████╔╝   ██║      ██║   ╚██████╔╝██║ ╚████║███████║
     *    ╚═════╝  ╚═════╝    ╚═╝      ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝
     *
     */

    /**
     * Handles press of the New dataset button
     * @param  {object} oEvent Button press event
     */
    DataSets.prototype.onMasterAddPress = function(oEvent) {
      // deselect all list items...
      var oList = this.getView().byId('idDataSetMasterList');
      oList.removeSelections(true /* all */ );

      // Nav to the wizard...
      this.getRouter().navTo("new-dataset", {}, !sap.ui.Device.system.phone);
    };

    /**
     * Handles press of the Edit datasets button
     * @param  {object} oEvent Button press event
     */
    DataSets.prototype.onMasterSelectPress = function(oEvent) {

      // toggle the master buttons
      this.toggleMasterSelectMode(true /* bSelect */ );
    };

    /**
     * Handles press of the editing Donebutton
     * @param  {object} oEvent Button press event
     */
    DataSets.prototype.onMasterDonePress = function(oEvent) {
      // toggle the master buttons
      this.toggleMasterSelectMode(false /* bSelect */ );

      // and because the toggle function switches all list items into Inactive
      // mode, we may need to reselect the currently routed dataset, if any.
      this.maybeSelectMasterListItem("/DataSets('" + this._sId + "')");
    };

    /**
     * Handles deletion of a dataset item from the master list; because
     * I can't get DELETE working in my php rev proxy in IIS, I'm doing
     * everything by batch calls in development.
     * @param  {object} oEvent Delete button pressed (contains parameter listItem)
     */
    DataSets.prototype.onMasterDeletePress = function(oEvent) {
      let oList = this.getView().byId("idDataSetMasterList");
      oList.setBusy(true);
      let bRefresh = false;

      // Delete via. batch job
      let oModel = this.getView().getModel("dataset");
      oList.getSelectedItems().forEach(function(item, index) {
        let sId = item.getBindingContext("dataset").getProperty("id");
        this._aBatchOps.push(oModel.createBatchOperation("/DataSets('" + sId + "')", "DELETE"));

        // If this data set is currently displayed, then trigger a Refresh
        // of data set detail Page
        if (sId = this._sId) {
          bRefresh = true;
        }
      }, this);

      // How many data sets are we deleting here?
      let iCount = this._aBatchOps.length;

      // Declare a promise, so we can determine what to do after batch is submitted
      let oPromise = jQuery.Deferred();
      jQuery.when(oPromise).done(jQuery.proxy(function() {

        // All okay!
        sap.m.MessageToast.show(iCount === 1 ? "Data set deleted" : "Data sets deleted");

        // Display the
        if (bRefresh) {
          this.getRouter().navTo("datasets", {}, !sap.ui.Device.system.phone);
        }

        // Not busy
        oList.setBusy(false);

        // Trigger press of the Done button to exit Select mode
        this.getView().byId("idMasterDoneButton").firePress();
      }, this)).fail(jQuery.proxy(function() {

        // Not busy
        oList.setBusy(false);

        // Error
        sap.m.MessageToast.show("Deleting Data Sets failed");
      }, this))

      // Submit deletion batch job
      this.submitBatch(false /* bUpdate model */ , oPromise);
    };

    /**
     * Toggle the list and edit buttons in the master view to edit mode (or not)
     * @param  {boolean} bEdit Edit mode?
     */
    DataSets.prototype.toggleMasterSelectMode = function(bSelect) {
      let oView = this.getView();

      // Toggle the list to Delete mode
      let oList = oView.byId("idDataSetMasterList");
      let sListMode = sap.m.ListMode.SingleSelectMaster;
      if (bSelect) {
        sListMode = sap.m.ListMode.MultiSelect;
      }
      oList.setMode(sListMode);

      // All items are now inacative
      let sListType = sap.m.ListType.Active;
      if (bSelect) {
        sListType = sap.m.ListType.Inactive;
      }

      // Update list items' type
      oList.getItems().forEach(function(item, index) {
        item.setType(sListType);
      }, this);

      // Hide the edit button
      let oButton = oView.byId("idMasterSelectButton").setVisible(!bSelect);

      // Show the Done button
      oButton = oView.byId("idMasterDoneButton").setVisible(bSelect);

      // Dis/enable the add new button
      oButton = oView.byId("idMasterAddButton").setVisible(!bSelect);

      oButton = oView.byId("idMasterDeleteButton").setVisible(bSelect);
    };

    /***
     *    ██████╗  █████╗ ████████╗ ██████╗██╗  ██╗
     *    ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║  ██║
     *    ██████╔╝███████║   ██║   ██║     ███████║
     *    ██╔══██╗██╔══██║   ██║   ██║     ██╔══██║
     *    ██████╔╝██║  ██║   ██║   ╚██████╗██║  ██║
     *    ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
     *
     */

    /**
     * Submits all batch operations currently pending.
     */
    DataSets.prototype.submitBatch = function(bUpdate, oPromise) {
      // We'll need a self for inside the success/error closures
      var self = this;

      // collect model so we can update
      var oModel = this.getView().getModel("dataset");

      // add batch ops.
      oModel.addBatchChangeOperations(this._aBatchOps);

      // submit batch
      oModel.submitBatch(function(oData, oResponse, aErrorResponses) {

          // empty the batch changes (this is apparently quite fast)
          while (self._aBatchOps.length > 0) {
            self._aBatchOps.pop();
          }

          // resolve the promise, if supplied
          if (oPromise) {
            oPromise.resolve();
          }
        }, function(oError) {

          // reject the promise, if supplied
          if (oPromise) {
            oPromise.reject();
          }
        },
        true, // async?
        bUpdate // Import data?
      );
    };

    return DataSets;

  }, /* bExport= */ true);
