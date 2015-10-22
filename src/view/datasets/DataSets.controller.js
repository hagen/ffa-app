jQuery.sap.declare("com.ffa.hpc.view.datasets.DataSets");

// Provides controller view.DataSets
sap.ui.define(['jquery.sap.global', 'com/ffa/hpc/view/datasets/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var DataSets = Controller.extend("com.ffa.hpc.view.datasets.DataSets", /** @lends com.ffa.hpc.view.datasets.DataSets.prototype */ {

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
      this.getEventBus().subscribe("Master", "SelectItem", this.handleSelectMasterListItem, this);

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
      this.checkMetaDataLoaded("dataset");
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

      // take the master list out of select mode, if it's in it...
      var oList = this.getView().byId("idDataSetMasterList");
      this.getRouter().navTo("dash", {}, !sap.ui.Device.system.phone);

      // Delayed call to remove select state, so as not to hold up nav
      jQuery.sap.delayedCall(1000, this, function() {
        oList.setMode(sap.m.ListMode.SingleSelectMaster);
      }, []);
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

      jQuery.when(this._oMasterLoadedPromise).then(jQuery.proxy(function() {
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
                this._sId = aItems[i].getBindingContext("dataset").getProperty("id");
                break;
              }
            }
          }
        }
      }, this));
    };

    /**
     * If a data source specific page fires this event, we respond by selecting
     * the matching list item in the Master list.
     * @param  {String} sChannel The event channel
     * @param  {String} sEvent   The event name
     * @param  {Object} oData    Payload
     */
    DataSets.prototype.handleSelectMasterListItem = function(sChannel, sEvent, oData) {
      // Hand-off - maybeSelect will do this for us
      this.maybeSelectMasterListItem("/DataSets('" + oData.dataset_id + "')");
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

      var oList = oEvent.getSource();
      var oItem = oEvent.getParameter("listItem");

      // If the oItem is already selected, then don't re-select/and re navigate
      var sId = oItem.getBindingContext("dataset").getProperty("id");
      if (sId === this._sId) {
        return;
      }

      // Otherwise, we need to navigate to the correct detail view for the selected
      // data source. Start by determining the data source type /DataSource/Source
      var sType = oItem.getBindingContext("dataset").getProperty("type_id").toLowerCase();
      this.getRouter().navTo("view-" + sType, {
        dataset_id: sId
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

      // Busy!
      this.showBusyDialog({});

      var oList = this.getView().byId("idDataSetMasterList");

      // Delete via. batch job
      var oModel = this.getView().getModel("dataset");
      var aItems = oList.getSelectedItems();

      // Check we have items...
      if (aItems.length === 0) {
        this.hideBusyDialog();
        this.showInfoAlert(
          "You haven't selected any data sets - nothing to delete!",
          "No data sets selected",
          sap.ui.Device.system.phone
        );
        return;
      }

      // We're going to display a dialog list of data sets that can be deleted,
      // and those that cannot. if there are attached forecasts, the dataset
      // cannot be deleted.
      var aFilters = [];
      aItems.forEach(function(item, index) {
        aFilters.push(new sap.ui.model.Filter({
          path: 'id',
          operator: sap.ui.model.FilterOperator.EQ,
          value1: item.getBindingContext("dataset").getProperty("id")
        }));
      });

      // Now open the list dialog.
      var d = this._oDeletionDialog;
      if (!d) {
        this._oDeletionDialog = d = sap.ui.xmlfragment("idDeletionFragment", "com.ffa.hpc.view.datasets.DeletionListDialog", this);
        this.getView().addDependent(d);
      }

      // Now we bind the list inside the dialog to our filter list of datasets
      var oList = sap.ui.core.Fragment.byId("idDeletionFragment", "idList"),
        oTemplate = new sap.m.StandardListItem({
          adaptTitleSize: true,
          icon: "sap-icon://{dataset>DataSource/icon}",
          title: "{dataset>name}",
          type: "Active",
          info: {
            path: "dataset>Forecasts",
            filters: [
              new sap.ui.model.Filter({
                path: 'endda',
                operator: sap.ui.model.FilterOperator.GT,
                value1: new Date(Date.now())
              })
            ],
            formatter: function(collection) {
              if (collection) {
                var length = collection.length;
                return (length > 1 ? length + " forecasts" : length + " forecast");
              }
              return "OK";
            }
          },
          infoState: {
            path: "dataset>Forecasts",
            filters: [
              new sap.ui.model.Filter({
                path: 'endda',
                operator: sap.ui.model.FilterOperator.GT,
                value1: new Date(Date.now())
              })
            ],
            formatter: function(collection) {
              if (collection) {
                return (collection.length > 0 ? sap.ui.core.ValueState.Error : sap.ui.core.ValueState.Success);
              }
              return sap.ui.core.ValueState.Success;
            }
          }
        });

      // Bind the list with our rather large function template
      oList.bindItems({
        path: 'dataset>/DataSets',
        parameters: {
          expand: "Forecasts",
          select: "Forecasts/id"
        },
        filters: aFilters,
        sorter: [new sap.ui.model.Sorter({
          path: 'type_id',
          descending: false
        })],
        template: oTemplate
      });

      // Not busy!
      jQuery.sap.delayedCall(1000, this, this.hideBusyDialog, [{}]);

      // open the dialog...
      jQuery.sap.delayedCall(0, d, d.open, []);
    };

    /**
     * Toggle the list and edit buttons in the master view to edit mode (or not)
     * @param  {boolean} bEdit Edit mode?
     */
    DataSets.prototype.toggleMasterSelectMode = function(bSelect) {
      var oView = this.getView();

      // Toggle the list to Delete mode
      var oList = oView.byId("idDataSetMasterList");
      var sListMode = sap.m.ListMode.SingleSelectMaster;
      if (bSelect) {
        sListMode = sap.m.ListMode.MultiSelect;
      }
      oList.setMode(sListMode);

      // All items are now inacative
      var sListType = sap.m.ListType.Active;
      if (bSelect) {
        sListType = sap.m.ListType.Inactive;
      }

      // Update list items' type
      oList.getItems().forEach(function(item, index) {
        item.setType(sListType);
      }, this);

      // Hide the edit button
      var oButton = oView.byId("idMasterSelectButton").setVisible(!bSelect);

      // Show the Done button
      oButton = oView.byId("idMasterDoneButton").setVisible(bSelect);

      // Dis/enable the add new button
      oButton = oView.byId("idMasterAddButton").setVisible(!bSelect);

      oButton = oView.byId("idMasterDeleteButton").setVisible(bSelect);
    };

    /***
     *    ██████╗ ███████╗██╗     ███████╗████████╗███████╗    ██████╗ ██╗ █████╗ ██╗      ██████╗  ██████╗
     *    ██╔══██╗██╔════╝██║     ██╔════╝╚══██╔══╝██╔════╝    ██╔══██╗██║██╔══██╗██║     ██╔═══██╗██╔════╝
     *    ██║  ██║█████╗  ██║     █████╗     ██║   █████╗      ██║  ██║██║███████║██║     ██║   ██║██║  ███╗
     *    ██║  ██║██╔══╝  ██║     ██╔══╝     ██║   ██╔══╝      ██║  ██║██║██╔══██║██║     ██║   ██║██║   ██║
     *    ██████╔╝███████╗███████╗███████╗   ██║   ███████╗    ██████╔╝██║██║  ██║███████╗╚██████╔╝╚██████╔╝
     *    ╚═════╝ ╚══════╝╚══════╝╚══════╝   ╚═╝   ╚══════╝    ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝
     *
     */

    /**
     * Close the deletion dialog and delete all the items.
     * @param  {oEvent} oEvent Button press event
     */
    DataSets.prototype.onDialogCancelPress = function(oEvent) {
      // Close the dialog and clear the list
      var d = this._oDeletionDialog;
      if (d) {
        d.close();
        sap.ui.core.Fragment.byId("idDeletionFragment", "idList").destroyItems();
      }
    };

    /**
     * When the user selects delete, we remove only those list item datasets
     * where the info state is Success
     * @param  {Event} oEvent Button press event
     */
    DataSets.prototype.onDialogDeletePress = function(oEvent) {
      // Delete those data sets that are allowed to be deleted
      var oList = sap.ui.core.Fragment.byId("idDeletionFragment", "idList"),
        aItems = oList.getItems(),
        oModel = this.getView().getModel("dataset"),
        bRefresh = false;

      // Busy
      this.showBusyDialog({});

      // For all remaining items, perform deletion.
      aItems.forEach(function(item, index) {
        // we do not delete data sets that are not in successful state, because
        // they have children forecasts dependent on them
        if (item.getInfoState() !== sap.ui.core.ValueState.Success) {
          return;
        }

        // Delete!
        var sId = item.getBindingContext("dataset").getProperty("id");
        this._aBatchOps.push(oModel.createBatchOperation("/DataSets('" + sId + "')", "DELETE"));

        // If this data set is currently displayed, then trigger a Refresh
        // of data set detail Page
        if (sId = this._sId) {
          bRefresh = true;
        }
      }, this);

      // How many data sets are we deleting here?
      var iCount = this._aBatchOps.length;

      // Tidy up function
      var tidy = jQuery.proxy(function() {
        // Not busy...
        this.hideBusyDialog();

        // Close popup
        this.onDialogCancelPress(null);
      }, this);

      // Declare a promise, so we can determine what to do after batch is submitted
      var oPromise = jQuery.Deferred();
      jQuery.when(oPromise).done(jQuery.proxy(function() {

        // Tidy up...
        tidy();

        // All okay!
        sap.m.MessageToast.show(iCount === 1 ? "Data set deleted" : "Data sets deleted");

        // Display the datasets page, with nothing selected, because we've just deleted
        // the currently viewing data set
        if (bRefresh) {
          this.getRouter().navTo("datasets", {}, !sap.ui.Device.system.phone);
        }

        // Trigger press of the Done button to exit Select mode
        this.getView().byId("idMasterDoneButton").firePress();
      }, this)).fail(jQuery.proxy(function() {

        // Tidy up...
        tidy();

        // Error
        sap.m.MessageToast.show("Deleting Data Sets failed");
      }, this))

      // Submit deletion batch job
      this.submitBatch(false /* bUpdate model */ , oPromise);
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
