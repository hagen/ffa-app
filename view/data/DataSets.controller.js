jQuery.sap.declare("view.data.DataSets");

// Provides controller view.DataSets
sap.ui.define(['jquery.sap.global', 'com/ffa/dash/util/Controller'],
	function(jQuery, Controller) {
	"use strict";

	var DataSets = Controller.extend("view.data.DataSets", /** @lends view.data.DataSets.prototype */ {

		/**
		 * Batch operations
		 * @type {Array}
		 */
		_aBatchOps : []
	});

	/**
	 * On init handler
	 */
	DataSets.prototype.onInit = function() {

		// Deferred promise tells us when the master list is loaded.
		this._oMasterLoadedPromise = new jQuery.Deferred();

		// If we're on a phone, immediately resolve, as we don't have to wait for
		// the master to load before showing the detail.
		if(sap.ui.Device.system.phone) {
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

	/**
	 * Route matched handler...
	 * When matching the route of a data set, we only need to know the data set
	 * Id in order to figure out what type of dataset it is.
	 */
	DataSets.prototype._onRouteMatched = function(oEvent) {
		var oParameters = oEvent.getParameters();

		// The dataset ID may not have been provided. If not, that's cool
		if(oParameters.arguments.dataset_id) {
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
			if(!sap.ui.Device.system.phone){
				oSplitContainer.toDetail(oMessagePage);
			}
		}
	};

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
	 * Handles nav back press
	 * @param  {object} oEvent Button press event
	 */
	DataSets.prototype.onNavBackPress = function(oEvent) {
		this.getRouter().myNavBack("dash");
	};

	/**
	 * Opens the detail page for the data set id
	 * @param  {String} sId The data set id to open
	 */
	DataSets.prototype.showDetail = function(sId) {
		// What's the path?
		var sPath = "/DataSets('" + sId + "')";
		var oParams = { expand : "Dimensions" };

		// wait for the master list to have loaded.
		jQuery.when(this._oMasterLoadedPromise).then(jQuery.proxy( function() {
			// Now that we have the Id, determine the type of view required
			var oData = this.getView().getModel("dataset").getProperty(sPath);
			var sSource = jQuery.sap.charToUpperCase(oData.type_id, 0);
			var sDetailPageId = "idDataSetDetailPage" + sSource;

			// Bind the view to the data set Id
			var oPage = this.getView().byId(sDetailPageId);
			switch(sSource) {
				case "Excel":
					oParams.expand += ",Excel"; break;
				case "Google":
					oParams.expand += ",Google"; break;
			}

			// Bind the destination page with the path and expand params
			oPage.bindElement("dataset>" + sPath, oParams);

			// and do the split container nav
			var oSplitContainer = this.getView().byId("idDataSetsSplitContainer");
			oSplitContainer.toDetail(oPage);

			// And we may also need to select the master list item, if we
			// navigated here without using the list.
			this.maybeSelectMasterListItem(sPath);
		},this));
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
			if(aItems[i] instanceof sap.m.StandardListItem) {
				if (aItems[i].getBindingContext("dataset").getPath() === sPath) {
					// Because we're single select, selecting this item will deselect
					// all others.
					if(!aItems[i].getSelected()) {
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
		var oItem = oEvent.getParameter("listItem");
		var oList = oItem.getParent();

		// If the oItem is already selected, then don't re-select/and re navigate
		if(oItem.getBindingContext("dataset").getProperty("id") === this._sId) {
			return;
		}

		// Otherwise, we need to navigate to the correct detail view for the selected
		// data source. Start by determining the data source type /DataSource/Source
		this.getRouter().navTo("datasets", {
			dataset_id : oItem.getBindingContext("dataset").getProperty("id")
		}, !sap.ui.Device.system.phone);
	};

	/**
	 * Handles press of the New dataset button
	 * @param  {object} oEvent Button press event
	 */
	DataSets.prototype.onMasterAddButtonPress = function(oEvent) {
		// deselect all list items...
		var oList = this.getView().byId('idDataSetMasterList');
		oList.removeSelections(true /* all */);

		// Nav to the wizard...
		this.getRouter().navTo("new-dataset", {}, !sap.ui.Device.system.phone);
	};

	/**
	 * Handles press of the Edit datasets button
	 * @param  {object} oEvent Button press event
	 */
	DataSets.prototype.onMasterEditButtonPress = function(oEvent) {

		// toggle the master buttons
		this.toggleMasterEditMode(true);
	};

	/**
	 * Handles deletion of a dataset item from the master list; because
	 * I can't get DELETE working in my php rev proxy in IIS, I'm doing
	 * everything by batch calls in development.
	 * @param  {object} oEvent Delete button pressed (contains parameter listItem)
	 */
	DataSets.prototype.onDataSetListItemDeletePress = function(oEvent) {
		var oItem = oEvent.getParameter("listItem");
		var oList = oItem.getParent();
		var sId = oItem.getBindingContext("dataset").getProperty("id");

		// Simulates deletion of the list item (by hiding it)
		oItem.setVisible(false);

		// Delete
		//this.getView().getModel("datasets").remove("/DataSets('" + sId + "')");
		this._aBatchOps.push(this.getView().getModel("dataset").createBatchOperation("/DataSets('" + sId + "')", "DELETE"));
	};

	/**
	 * Handles press of the editing Donebutton
	 * @param  {object} oEvent Button press event
	 */
	DataSets.prototype.onMasterDoneButtonPress = function(oEvent) {
		// toggle the master buttons
		this.toggleMasterEditMode(false);

		// Submit deletion batch job
		this.submitBatch(false /* bUpdate model */);
	};

	/**
	 * Toggle the list and edit buttons in the master view to edit mode (or not)
	 * @param  {boolean} bEdit Edit mode?
	 */
	DataSets.prototype.toggleMasterEditMode = function(bEdit) {
		var oView = this.getView();

		// Toggle the list to Delete mode
		var oList = oView.byId("idDataSetMasterList");
		if(bEdit) {
			oList.setMode(sap.m.ListMode.Delete);
		} else {
			oList.setMode(sap.m.ListMode.None);
		}

		// Hide the edit button
		var oEditBtn = oView.byId("idDataSetMasterEditButton");
		oEditBtn.setVisible(!bEdit);

		// Show the Done button
		var oDoneBtn = oView.byId("idDataSetMasterDoneButton");
		oDoneBtn.setVisible(bEdit);

		// Dis/enable the add new button
		var oAddBtn = oView.byId("idDataSetMasterAddButton");
		oAddBtn.setEnabled(!bEdit);
	};

	/**
	 * Submits all batch operations currently pending.
	 */
	DataSets.prototype.submitBatch = function(bUpdate) {
		// We'll need a this for inside the success/error closures
		var that = this;

		// collect model so we can update
		var oModel = this.getView().getModel("dataset");

		// add batch ops.
		oModel.addBatchChangeOperations(this._aBatchOps);

  	// submit batch
		oModel.submitBatch(function(oData, oResponse, aErrorResponses) {
				// empty the batch changes (this is apparently quite fast)
				while(that._aBatchOps.length > 0) {
				    that._aBatchOps.pop();
				}
			}, function(oError) {
				sap.m.MessageToast.show("Deleting Data Sets failed");
			},
			true, // async?
			bUpdate // Import data?
		);
	};

	/**
	 * When the data definition type link is pressed, we allow the user to modify
	 * the data type, through a simple drop-down. Changes are immediate.
	 * @param  {object} oEvent Link press event
	 */
  DataSets.prototype.onDataSetDefinitionTypeLinkPress = function(oEvent) {
		// Get the source and it's binding context
		var oLink = oEvent.getSource();
		var oParent = oLink.getParent(); // Column list item (with collection cells)
		var sId = oParent.getBindingContext("dataset").getProperty("id");

		// Create the dialog fragment.
		if(!this._oDimensionTypeDialog) {
      this._oDimensionTypeDialog = sap.ui.xmlfragment("idDimensionDataTypeFragment", "view.data.DimensionDataTypeDialog", this);
      this.getView().addDependent(this._oDimensionTypeDialog);
    }

		// Just set the correct selected key
		sap.ui.core.Fragment.byId("idDimensionDataTypeFragment", "idDimensionDataTypeSelectList").setSelectedKey(oLink.getText().toLowerCase());

		// supply the dialog with the binding Id, so we can use it later...
		this._oDimensionTypeDialog.data("id", sId);

    // now show the dialog
    this._oDimensionTypeDialog.open();
	};

	/**
	 * When the dimension data type picker dialog is closed, we simply
	 * close the dialog; no changes are applied
	 * @param  {object} oEvent  Event source (button press)
	 */
	DataSets.prototype.onDimensionDataTypeDialogClose = function(oEvent) {
		// No longer busy
		this._oDimensionTypeDialog.setBusy(true);
		// now close the dialog
    this._oDimensionTypeDialog.close();
	};

	/**
	 * When the dimension type select is changed, this event handler is fired
	 * by proxy, and in so doing, is passed the event source the select) and
	 * the original link. The link object needs to be replaced into the collection
	 * of cells, at position 2 (index 1)
	 * @param  {object} oEvent  Event source (Dropdown to hide)
	 */
	DataSets.prototype.onDimensionTypeSelectChanged = function(oEvent) {
		// Busy!
		this._oDimensionTypeDialog.setBusy(true);

		var oItem = oEvent.getParameter("selectedItem");
		var sType = oItem.getText().toLowerCase();
		var sId = this._oDimensionTypeDialog.data("id");

		// when the dropdown selection is changed
		// save the change and return the link with it's new value
		var oModel = this.getView().getModel("dataset");
		oModel.setProperty("/Dimensions('" + sId + "')/type", sType);
		oModel.submitChanges(jQuery.proxy(function() {
			// close
			this.onDimensionDataTypeDialogClose(null);
		}, this), jQuery.proxy(function(){
			// close
			this.onDimensionDataTypeDialogClose(null);
		}, this),
		false);
	}

  /**
   *
   *
   * Google Sheets
   *
   *
   */

	return DataSets;

}, /* bExport= */ true);
