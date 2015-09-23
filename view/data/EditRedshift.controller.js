jQuery.sap.declare("view.data.EditRedshift");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "view/data/EditController"],
  function(jQuery, Controller) {
    "use strict";

    var Redshift = Controller.extend("view.data.EditRedshift", /** @lends view.data.EditRedshift.prototype */ {

    });

    /**
     * On init handler. We are setting up the route matched handler, because
     * it is possible to navigate directly to this page.
     */
    Redshift.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("edit-redshift").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Redshift.prototype.onExit = function() {};

    /**
     *
     */
    Redshift.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Redshift.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Redshift.prototype._onRouteMatched = function(oEvent) {
      this._checkMetaDataLoaded("dataset");
      var oParameters = oEvent.getParameters();

      // The dataset ID may not have been provided. If not, that's cool
      if (oParameters.arguments.dataset_id) {
        // retain the data set id
        this._sId = oParameters.arguments.dataset_id;

        // Bind the view to the data set Id
        var oPage = this.getView().byId("idRedshiftPage");

        // Bind the destination page with the path and expand params
        oPage.bindElement("dataset>/DataSets('" + this._sId + "')", {
          expand: "Dimensions,Redshift"
        });
      }
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
     * Once the user is done editing, we'll validate the name they've given
     * their data set, the username, the password, and try to connect. If connection
     * was successful, then we are good to save to DB
     * @param  {Event} oEvent Button press event
     */
    Redshift.prototype.onDonePress = function(oEvent) {

      // Easier
      var get = jQuery.proxy(this.getControl, this);
      var oButton = oEvent.getSource();

      // Validaty checks
      var bSaveAuth = get("idRememberCheckBox").getSelected();
      if (!this._isValid(
          get("idNameInput"),
          get("idUsernameInput"),
          get("idPasswordInput"),
          bSaveAuth)) {

        return;
      }

      // Perform a test against HANA, to make sure the details are valid
      var oTestPromise = jQuery.Deferred();
      var sSuccessText = "";

      // if we're not saving username and password however, don't bother
      if (!bSaveAuth) {

        sSuccessText = "Saving your data set changes...";
        oTestPromise.resolve();
      } else {

        // Busy
        this.showBusyDialog({
          title: "Testing connection",
          text: "Testing connection details before saving - one moment please..."
        });
        sSuccessText = "Connected succesfully! Saving...";
        this._test(oTestPromise, get);
      }

      // If the test fails, then show the error.
      jQuery.when(oTestPromise)
        .fail(jQuery.proxy(function() {
          // Not busy
          this.hideBusyDialog();

          // Show error..
          this.showErrorAlert(
            "Couldn't connect to Redshift. Your username or password combination may be incorrect",
            "Error connecting",
            sap.ui.Device.system.phone
          );
        }, this))

      // If successful, continue.
      .done(jQuery.proxy(function() {
        // Update busy to indicate saving.
        this.updateBusyDialog({
          title: "Saving",
          text: sSuccessText
        });

        // Try and update...
        var oModel = this.getView().getModel("dataset");
        var aBatch = [];

        // First change is for the name and the headers key
        aBatch.push(oModel.createBatchOperation("/DataSets('" + this._sId + "')", "MERGE", {
          name: get("idNameInput").getValue(),
        }));

        // Are we saving username/password?
        if (bSaveAuth) {
          aBatch.push(oModel.createBatchOperation("/Redshift('" + this._sId + "')", "MERGE", {
            username: get("idUsernameInput").getValue(),
            password: get("idPasswordInput").getValue(),
            remember: "X"
          }));
        } else {
          aBatch.push(oModel.createBatchOperation("/Redshift('" + this._sId + "')", "MERGE", {
            username: "",
            password: "",
            remember: ""
          }));
        }

        // Build the dimensions batch requests, and add to our existing payload
        aBatch = aBatch.concat(this._createDimensionsBatch(oModel));

        // Add and Submit!
        oModel.addBatchChangeOperations(aBatch);
        oModel.submitBatch(
          // Success
          jQuery.proxy(function(oData, oResponse, aErrorResponses) {

            // Clear links
            while (this._aLinks.length > 0) {
              this._aLinks.pop();
            }
            this._oLink = null;

            // Nav Back
            this.getRouter().navTo("view-redshift", {
              dataset_id: this._sId
            }, !sap.ui.Device.system.phone);

            // Busy
            this.hideBusyDialog();
          }, this),
          // Error
          jQuery.proxy(function(oError) {

          }, this),
          true, /* bAsync */
          false /* bImportData */
        );
      }, this));
    };

    /**
     * Cancel editing. Id we are cancelling, then we are also undoing any changes
     * to editable text fields, and then making these text fields uneditable.
     * @param  {Event} oEvent Button event
     */
    Redshift.prototype.onCancelPress = function(oEvent) {

      // Easier
      var get = jQuery.proxy(this.getControl, this);

      // Now we undo all the changes... first, the text input.
      var oControl = get("idNameInput");
      oControl.setValue(oControl.data("original"))
        .setValueState(sap.ui.core.ValueState.None)
        .setValueStateText("");

      // username
      oControl = get("idUsernameInput");
      oControl.setValue(oControl.data("original"))
        .setValueState(sap.ui.core.ValueState.None)
        .setValueStateText("");

      // password
      oControl = get("idPasswordInput");
      oControl.setValue(oControl.data("original"))
        .setValueState(sap.ui.core.ValueState.None)
        .setValueStateText("");

      // and the check box
      oControl = get("idRememberCheckBox");
      oControl.setSelected(oControl.data("original") === "X");

      // The query text area has it's value state text removed, because a little
      // message was added to it.
      get("idQueryTextArea").setValueStateText("");

      // And the links
      this._aLinks.forEach(function(link, index) {
        // replace the link text with the original text
        link.setText(link.data("original"));
      }, this);

      // Clear links
      while (this._aLinks.length > 0) {
        this._aLinks.pop();
      }
      this._oLink = null;

      // Navigate backwards
      this.getRouter().navTo("view-redshift", {
        dataset_id: this._sId
      }, !sap.ui.Device.system.phone);
    };

    /***
     *    ██████╗ ███████╗███╗   ███╗███████╗███╗   ███╗██████╗ ███████╗██████╗
     *    ██╔══██╗██╔════╝████╗ ████║██╔════╝████╗ ████║██╔══██╗██╔════╝██╔══██╗
     *    ██████╔╝█████╗  ██╔████╔██║█████╗  ██╔████╔██║██████╔╝█████╗  ██████╔╝
     *    ██╔══██╗██╔══╝  ██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║██╔══██╗██╔══╝  ██╔══██╗
     *    ██║  ██║███████╗██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║██████╔╝███████╗██║  ██║
     *    ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
     *
     */

    /**
     * When the check box is selected, we must be in edit mode for anything
     * to happen. Namely, we enable, disable the authentication fields.
     * @param  {Event} oEvent CheckBox select Event
     */
    Redshift.prototype.onCheckBoxSelect = function(oEvent) {

      // Can't do anything if we're not in edit mode
      if (!this._editMode) {
        return;
      }

      // if this is selected, then enable the username/password
      var bSelected = oEvent.getParameter("selected");
      var get = jQuery.proxy(this.getControl, this);
      if (bSelected) {
        get("idUsernameInput").setEnabled(true);
        get("idPasswordInput").setEnabled(true);
      } else {
        get("idUsernameInput").setEnabled(false)
          .setValueState(sap.ui.core.ValueState.None)
          .setValueStateText("")
          .setValue("");
        get("idPasswordInput").setEnabled(false)
          .setValueState(sap.ui.core.ValueState.None)
          .setValueStateText("")
          .setValue("");
      }
    };

    /***
     *     ██████╗ ██████╗ ███╗   ██╗████████╗██████╗  ██████╗ ██╗     ███████╗
     *    ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔═══██╗██║     ██╔════╝
     *    ██║     ██║   ██║██╔██╗ ██║   ██║   ██████╔╝██║   ██║██║     ███████╗
     *    ██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██╗██║   ██║██║     ╚════██║
     *    ╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║╚██████╔╝███████╗███████║
     *     ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝
     *
     */

    /**
     * Collects the editable controls, that need to be validated.
     * @param  {Function} fnGet  Getter function
     * @return {Array}           Array of Controls
     */
    Redshift.prototype._getEditableControls = function(fnGet) {

      var aControls = [];
      if (typeof fnGet === "function") {
        aControls = [
          fnGet("idNameInput"),
          fnGet("idUsernameInput"),
          fnGet("idPasswordInput"),
          fnGet("idRememberCheckBox")
        ];
      }
      return aControls;
    };

    /***
     *    ██╗   ██╗ █████╗ ██╗     ██╗██████╗
     *    ██║   ██║██╔══██╗██║     ██║██╔══██╗
     *    ██║   ██║███████║██║     ██║██║  ██║
     *    ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║
     *     ╚████╔╝ ██║  ██║███████╗██║██████╔╝
     *      ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝
     *
     */

    /**
     * Validates the controls, based on the save auth value. If we are saving
     * authentication details, then we need to validate they are provided
     * @param  {Control} oName      Name control
     * @param  {Control} oUsername  Username control
     * @param  {Control} oPassword  Password control
     * @param  {Boolean} bCheckAuth Check auth details
     * @return {Boolean}            Valid?
     */
    Redshift.prototype._isValid = function(oName, oUsername, oPassword, bCheckAuth) {
      // Check each control, and verify that it is in a valid state.
      // If not, set error and return false.
      var bValid = true;

      // name input - always check this
      var sValue = oName.getValue();
      if (!sValue) {
        oName.setValueState(sap.ui.core.ValueState.Error)
          .setValueStateText("Your data set needs a name")
          .setShowValueStateMessage();
        bValid = false;
      } else {
        oName.setValueState(sap.ui.core.ValueState.None)
          .setValueStateText("");
      }

      // username and password
      if (bCheckAuth) {
        sValue = oUsername.getValue();
        if (!sValue) {
          oUsername.setValueState(sap.ui.core.ValueState.Error)
            .setValueStateText("Oops - forgot to add your Redshift username")
            .setShowValueStateMessage();;
          bValid = false;
        } else {
          oUsername.setValueState(sap.ui.core.ValueState.None)
            .setValueStateText("");
        }
      } else {
        oUsername.setValue("")
          .setValueState(sap.ui.core.ValueState.None)
          .setValueStateText("");
      }

      if (bCheckAuth) {
        sValue = oPassword.getValue();
        if (!sValue) {
          oPassword.setValueState(sap.ui.core.ValueState.Error)
            .setValueStateText("Redshift will need your password")
            .setShowValueStateMessage();;
          bValid = false;
        } else {
          oPassword.setValueState(sap.ui.core.ValueState.None)
            .setValueStateText("");
        }
      } else {
        oPassword.setValue("")
          .setValueState(sap.ui.core.ValueState.None)
          .setValueStateText("");
      }

      return bValid;
    };

    /***
     *    ████████╗███████╗███████╗████████╗
     *    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝
     *       ██║   █████╗  ███████╗   ██║
     *       ██║   ██╔══╝  ╚════██║   ██║
     *       ██║   ███████╗███████║   ██║
     *       ╚═╝   ╚══════╝╚══════╝   ╚═╝
     *
     */

    Redshift.prototype._test = function(oPromise, fnGet) {

      // Read the existing details
      var oModel = this.getView().getModel("dataset");
      var oObject = oModel.getObject("/Redshift('" + this._sId + "')");
      var oPayload = {};

      // Copy the object, without entites or __ fields
      for (var key in oObject) {
        if (oObject.hasOwnProperty(key)) {
          if (!(key === "Entities" || key.indexOf("__") > -1)) {
            oPayload[key] = oObject[key];
          }
        }
      }
      // update the username and password
      oPayload.id = ShortId.generate(10);
      oPayload.username = fnGet("idUsernameInput").getValue();
      oPayload.password = fnGet("idPasswordInput").getValue();

      // Test HANA; success call back if connection could be made
      oModel.create("/RedshiftTest", oPayload, {
        async: true,
        success: jQuery.proxy(function(oData, mResponse) {
          oPromise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {
          oPromise.reject();
        }, this)
      });
    };

    return Redshift;

  }, /* bExport= */ true);
