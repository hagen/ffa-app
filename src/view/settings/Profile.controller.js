jQuery.sap.declare("com.ffa.hpc.view.settings.Profile");

// Provides controller view.Wizard
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/settings/Controller"],
  function(jQuery, Controller) {
    "use strict";

    var Profile = Controller.extend("com.ffa.hpc.view.settings.Profile", /** @lends com.ffa.hpc.view.settings.Profile.prototype */ {

    });

    /**
     *
     */
    Profile.prototype.onInit = function() {

      // handle route matched
      this.getRouter().getRoute("profile").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     *
     */
    Profile.prototype.onExit = function() {};

    /**
     *
     */
    Profile.prototype.onBeforeRendering = function() {};

    /**
     *
     */
    Profile.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler fires up the Wizard straight away
     */
    Profile.prototype._onRouteMatched = function(oEvent) {
      // Make sure we have a meta data document
      this._checkMetaDataLoaded("profile");

      // Let the master list know I'm on this Folders view.
      this.getEventBus().publish("Profile", "RouteMatched", {} /* payload */ );

      // Bind this page to the Profile Id...
      var oPage = this.getView().byId("idProfilePage");
      oPage.bindElement("profile>/Profiles('TESTUSER')");
    };

    /***
     *    ███████╗██████╗ ██╗████████╗
     *    ██╔════╝██╔══██╗██║╚══██╔══╝
     *    █████╗  ██║  ██║██║   ██║
     *    ██╔══╝  ██║  ██║██║   ██║
     *    ███████╗██████╔╝██║   ██║
     *    ╚══════╝╚═════╝ ╚═╝   ╚═╝
     *
     */

    /**
     * When the edit button is pressed, we enable the form and begin Validation
     * on the entered content.
     * @param  {Event} oEvent Button press event
     */
    Profile.prototype.onEditPress = function(oEvent) {
      // Enable to edit profile form... set all fields to be editable, and apply
      // validation checks on each.
      var aControls = this._getControls();
      aControls.forEach(function(control, index) {
        control.setEnabled(true);
        control.data("original_value", control.getValue());
      }, this);

      // Set the Edit button to be the Save button
      var oButton = oEvent.getSource();
      oButton.detachPress(this.onEditPress, this).attachPress(this.onSavePress, this);
      oButton.setText("Save");

      // And show the Cancel button
      this.getView().byId("idCancelButton").setVisible(true);
    };

    /**
     * Cancel processing, and reset old values
     * @param  {Event} oEvent Button press event
     */
    Profile.prototype.onCancelPress = function(oEvent) {

      // And hide the Cancel button
      oEvent.getSource().setVisible(false);

      // Set the Edit button to be the Save button
      var oButton = this.getView().byId("idEditButton");
      oButton.detachPress(this.onSavePress, this).attachPress(this.onEditPress, this);
      oButton.setText("Edit");

      var oModel = this.getView().getModel("profile");
      if (oModel.hasPendingChanges()) {
        oModel.resetChanges();
      }

      // Send all controls back to being uneditable...
      var aControls = this._getControls();
      aControls.forEach(function(control, index) {
        // reapply original value
        control.setValue(control.data("original_value"));
        // disabled
        control.setEnabled(false);
        // no error state
        control.setValueState(sap.ui.core.ValueState.None);
      }, this);
    };

    /**
     * When the save button is pressed, we need to firstly validate. Once validated
     * we are posting the changes to HANA, and Node, so that the user's email address
     * is updated in both locations. perhaps also show a reminder that they need to
     * log in with this email address next time they access the app.
     * @param  {Event} oEvent Button press event
     */
    Profile.prototype.onSavePress = function(oEvent) {

      // Busy!
      this.showBusyDialog({});

      // When the save button is pressed, validate then save changes
      var aControls = this._getControls();
      if (!this._isProfileValid(aControls)) {
        // Not busy
        this.hideBusyDialog();
        return;
      }

      // Collec the button
      var oButton = oEvent.getSource();

      // Continue on. Collect the new details...
      var oData = {};
      aControls.forEach(function(control, index) {
        oData[control.getName()] = control.getValue().trim();
      }, this);

      // And do the update
      var oModel = this.getView().getModel("profile");
      var sProfileId = this.getProfileId();
      oModel.update("/Profiles('" + sProfileId + "')", oData, {
        merge: true,
        async: true,
        success: jQuery.proxy(function(oData, mResponse) {
          // Set the Edit button to be the Save button
          oButton.detachPress(this.onSavePress, this).attachPress(this.onEditPress, this);
          oButton.setText("Edit");

          // And hide the Cancel button
          this.getView().byId("idCancelButton").setVisible(false);

          // no longer editable...
          aControls.forEach(function(control, index) {
            control.setEnabled(false);
          }, this);

          // Not busy
          this.hideBusyDialog();
        }, this),
        error: jQuery.proxy(function(mError) {
          // Set the Edit button to be the Save button
          oButton.detachPress(this.onSavePress, this).attachPress(this.onEditPress, this);
          oButton.setText("Edit");

          // And hide the Cancel button
          this.getView().byId("idCancelButton").setVisible(false);

          // no longer editable...
          aControls.forEach(function(control, index) {
            control.setEnabled(false);
          }, this);
          // handle auth error, if any.
          this._maybeHandleAuthError(mError);

          // noy busy
          this.hideBusyDialog();
        }, this)
      });
    };

    /***
     *    ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
     *    ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
     *    ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   ██║██║   ██║██╔██╗ ██║
     *    ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
     *     ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
     *      ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     *
     */

    /**
     * Validates an input change event
     * @param  {Event} oEvent Button press event
     */
    Profile.prototype.onInputChange = function(oEvent) {
      var sValue = oEvent.getParameter("value");
      var oControl = oEvent.getSource();
      if (!sValue) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText(oControl.data("error"));
      } else {
        oControl.setValueState(sap.ui.core.ValueState.None);
      }
    };

    /**
     * Validates an email input change event
     * @param  {Event} oEvent Button press event
     */
    Profile.prototype.onEmailChange = function(oEvent) {
      var sValue = oEvent.getParameter("value");
      var oControl = oEvent.getSource();
      if (!sValue) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText(oControl.data("error_blank"));
      } else if (!this._validateEmail(sValue)) {
        oControl.setValueState(sap.ui.core.ValueState.Error);
        oControl.setValueStateText(oControl.data("error_regex"));
      } else {
        oControl.setValueState(sap.ui.core.ValueState.None);
      }
    };

    /**
     * For each of the supplied controls, determine if the content is valid.
     * Ultimately, return a flag indicating whether all fields are valid or not.
     * @param  {Array}  aControls  Array of screen controls
     * @return {Boolean}           Valid?
     */
    Profile.prototype._isProfileValid = function(aControls) {

      // Set up validity flag
      var bValid = true;

      // Zip through each control, and check if it's content is valid.
      aControls.forEach(function(control, index) {
        // get the value
        var sValue = control.getValue().trim();
        if (control.getType() === sap.m.InputType.Email) {
          if (!sValue) {
            control.setValueState(sap.ui.core.ValueState.Error);
            control.setValueStateText(control.data("error_blank"));
            bValid = false;
          } else if (!this._validateEmail(sValue)) {
            control.setValueState(sap.ui.core.ValueState.Error);
            control.setValueStateText(control.data("error_regex"));
            bValid = false;
          } else {
            control.setValueState(sap.ui.core.ValueState.None);
          }
        } else { // text input
          if (!sValue) {
            control.setValueState(sap.ui.core.ValueState.Error);
            control.setValueStateText(control.data("error"));
            bValid = false;
          } else {
            control.setValueState(sap.ui.core.ValueState.None);
          }
        }
      }, this);

      return bValid;
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
     * Collect all form controls on screen
     * @return {Array} Array of controls
     */
    Profile.prototype._getControls = function() {
      // Returns all form controls on the screen
      var self = this;
      var get = function(sId) {
        return self.getView().byId(sId);
      };

      return [
        get("idFirstNameInput"),
        get("idLastNameInput"),
        get("idEmailInput")
      ];
    };

    return Profile;

  }, /* bExport= */ true);
