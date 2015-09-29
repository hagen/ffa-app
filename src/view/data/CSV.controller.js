jQuery.sap.declare("view.data.CSV");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var CSV = Controller.extend("view.data.CSV", /** @lends view.data.CSV.prototype */ {
      _aData : []
    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    CSV.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("csv").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    CSV.prototype.onExit = function() {};

    /**
     *
     */
    CSV.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    CSV.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    CSV.prototype._onRouteMatched = function(oEvent) {};

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
     * [function description]
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    CSV.prototype.onCancelPress = function(oEvent) {
      // nav back to main Page
      try {
        this.getView().byId("idNavContainer").back();
      } catch (e) {}

      // Nav back to new data set
      this.getRouter().navTo("new-dataset", {}, !sap.ui.Device.system.phone);
    };

    /**
     * This handler is used to advance to the next screen. There is typically
     * a pause when advancing screens, while the data is being processed. This
     * is just preparing the columns of the data, and trying to identify types.
     * @param  {object} oEvent Button press event
     */
    CSV.prototype.onNextPress = function(oEvent) {

      var oButton = oEvent.getSource();
      var oPromise = jQuery.Deferred();

      // set screen to busy
      this.openBusyDialog({});

      // validate before showing busy dialog
      jQuery.sap.delayedCall(1500, this, this._validatePage1, [oPromise]);

      // if the promise is rejected, then we hide the busy dialog...
      var self = this;
      jQuery.when(oPromise).fail(function() {
        self.hideBusyDialog({});
      });

      // but hopefully it is resolved!
      jQuery.when(oPromise).done(jQuery.proxy(function() {
        // set screen to busy
        this.updateBusyDialog({
          title: "Preparing data",
          text: "Inspecting your data - be with you in a moment"
        });

        // Delayed call, for effect.
        jQuery.sap.delayedCall(1000, this, function() {

          // Prepare the data - have a look at a few random rows, and try to
          // figure out what we're looking at.
          this._prepare();

          // Button is now bound to the save action
          oButton.detachPress(this.onNextPress, this)
                  .attachPress(this.onSavePress, this)
                  .setText("Save");
          this.getView().byId("idBackButton").setEnabled(true);

          // advance to the next page
          var oNav = this.getView().byId("idNavContainer");
          oNav.to(this.getView().byId("idPageConfig"), "slide");

          // Not busy now
          this.hideBusyDialog();
        });
      }, this));
    };

    /**
     * When we hit back, allow the user to update the CSV content.
     * @param  {object} oEvent Button press event
     */
    CSV.prototype.onBackPress = function(oEvent) {
      // Button is now bound to the save action
      var oButton = this.getView().byId("idNextButton");
      oButton.detachPress(this.onSavePress, this)
              .attachPress(this.onNextPress, this)
              .setText("Next");

      // Set back button disabled
      oEvent.getSource().setEnabled(false);

      // Head back, boi!
      this.getView().byId("idNavContainer").back();
    };

    /**
     * Here we are confirming the save action. This will write the columns
     * to database. Note, that a temporary data set is created when Next
     * is pressed, so we reuse the data set id
     * @param  {object} oEvent Button press event
     */
    CSV.prototype.onSavePress = function(oEvent) {

      // set screen to busy
      this.openBusyDialog({
        title: "Saving",
        text: "Saving your CSV data - one moment please..."
      });

      // Save the redshift data...
      this.getView().getModel("dataset").create("/Redshift", this._getData(), {
        success: jQuery.proxy(function(oData, mResponse) {
          // Refresh the dataset listing by raising an event (subscribers will do
          // the work)
          this.getEventBus().publish("Detail", "RefreshMaster", {});

          // Update the screen, then close.
          this.updateBusyDialog({
            text: "All done! Finishing up..."
          });

          // Timed close.
          jQuery.sap.delayedCall(1500, this, function() {

            // NOt busy any more
            this.closeBusyDialog();

            // Navigate to the new data set...
            this.getRouter().navTo("datasets", {
              dataset_id: oData.id
            }, !sap.ui.Device.system.phone);

            // Reset the Back/Next buttons
            this.getView().byId("idNextButton").setText("Next");
            this.getView().byId("idBackButton").setEnabled(false);
          });
        }, this),
        error: jQuery.proxy(function(mError) {

          // Handle connection test errors
          this._handleSaveError(mError);

          // not busy any more
          this.closeBusyDialog();
        }, this),
        async: true,
      });
    };

    /***
     *    ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗███████╗
     *    ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
     *    ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   █████╗
     *    ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██╔══╝
     *     ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ███████╗
     *      ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
     *
     */

     /**
      * Validate each of the controls on the first screen.
      * @return {Deferred} Promise to be resolved/rejected
      */
    CSV.prototype._validatePage1 = function (oPromise) {
      var bResult = true;
      var oControl = this.getView().byId("idNameInput");
      if (!oControl.getValue()) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("Data set name can't be empty");

        // For the name, we can supply a dummy name, no worries.
        oControl.setValue("My new CSV data set");
        bResult = false;
      } else {
        oControl.setValueState(sap.ui.core.ValueState.None);
      }

      // and the serparator?
      oControl = this.getView().byId("idSeparatorInput");
      if (!oControl.getValue()) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("CSV files must have a separator. What's yours?");
        bResult = false;
      } else {
        oControl.setValueState(sap.ui.core.ValueState.None);
      }

      // keep headers flag for later
      var bHeaders = this.getView().byId("idHeadersCheckBox").getSelected();

      // and the data?
      oControl = this.getView().byId("idDataTextArea");

      // I'm going to do this once here, so it doesn't need to be done again.
      // This is an expensive operation if the data set is very large.
      this._aData = oControl.getValue().split("\n");
      var length = this._aData.length;

      // Process the input data...
      if (!oControl.getValue()) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("We're certainly going to need some CSV data");
        bResult = false;
      } else if(length === 0) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("It looks as though this data has no line breaks. Without these, I don't know where the end of the line is");
        bResult = false;
      } else if (length < 2 && bHeaders) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("Hmmm, you've only got one row, and it's header - you'll need more data to continue");
        bResult = false;
      } else if (length < 1 && !bHeaders) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText("Eesh, looks like you've not got any rows of data. We'll need some to continue");
        bResult = false;
      } else {
        oControl.setValueState(sap.ui.core.ValueState.None);
      }

      // What are we doing with this here Promise?
      if(!bResult) {
        oPromise.reject();
      } else {
        oPromise.resolve();
      }
    };

    /***
     *    ██████╗ ██████╗ ███████╗██████╗  █████╗ ██████╗ ███████╗
     *    ██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝
     *    ██████╔╝██████╔╝█████╗  ██████╔╝███████║██████╔╝█████╗
     *    ██╔═══╝ ██╔══██╗██╔══╝  ██╔═══╝ ██╔══██║██╔══██╗██╔══╝
     *    ██║     ██║  ██║███████╗██║     ██║  ██║██║  ██║███████╗
     *    ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
     *
     */

    /**
     * Collect the contents of our text fields; notably, the data text area,
     * and begin processing it. When done, we're going to need to store this
     * information in the back-end temporarily in order to bind the next screen
     * to it. Technically, that's not correct... let's see...
     * @return {[type]} [description]
     */
    CSV.prototype._prepare = function () {

      // Do we have headers?
      var bHeaders = this.getView().byId("idHeadersCheckBox").getSelected();
      var sSeparator = this.getView().byId("idSeparatorInput").getSelected();

      // grab a few samples from the aData array to do type testing on. Don't
      // want headers in there though; this will also split the entries
      // by the requested separator (if possible)
      var aSample = this._pickSample(( bHeaders ? this._aData.slice(1) : this._aData ), sSeparator);

      // Now we need to get types. This is going to be a slow process of type
      // checking. If necessary, take the header row. This will name our columns,
      // otherwise, they will have generated column names
      var aFields = this._findTypes(( bHeaders ? this._aData[0].split(aSeparator) : [] ), aSample);
    };

    /**
     * Picks a number of sample records from the supplied data array. At this point
     * we don't care what the data looks like, we just want some random rows.
     * We also have some assurances that we have at least one row of data,
     * as validation ensures this to be the case.
     * @param  {Array}  aData Data array of string lines
     * @param  {String} aSep  Separator to split on
     * @return {[type]}       [description]
     */
    CSV.prototype._pickSample = function (aData, aSep) {
      // Dependent on the length of aData, we'll pick 1-3 rows to test.
      var count = 0;
      if (aData.length > 5) {
        count = 5;
      } else if (aData.length > 2) {
        count = 2;
      } else {
        count = 1;
      }

      var aSample = [];
      var i = 0;
      for (i; i < count; i++) {
        aSample.push(aData[Math.floor(Math.random() * aData.length)].split(aSep));
      }

      // return our sample
      return aSample;
    };

    /**
     * Determine the types of all values in the supplied data.
     * @param  {Array} aHeaders Headers, as string values
     * @param  {Array} aData    Split data ready for parsing and type discovery
     * @return {[type]}         [description]
     */
    CSV.prototype._findTypes = function (aHeaders, aData) {
      // Types are returned as a schema that is suitable for storage in backend

    };

    return CSV;

  }, /* bExport= */ true);
