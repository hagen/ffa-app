jQuery.sap.declare("com.ffa.hpc.view.data.CreateController");
jQuery.sap.require("com.ffa.hpc.thirdparty.shortid.ShortId");

// Provides controller com.ffa.hpc.util.Controller
sap.ui.define(["jquery.sap.global", "com/ffa/hpc/view/data/Controller"],
  function(jQuery, DataController) {
    "use strict";

    var Controller = DataController.extend("com.ffa.hpc.view.data.CreateController", /** @lends com.ffa.hpc.view.data.CreateController */ {
      _sId: "",
      _oLink: null,
      _aLinks: []
    });

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
     * This nav back handler is effectively cancelling the date change operation
     * on the second page of the Date Type Change dialog nav container.
     * @param  {Event} oEvent Button press event
     */
    Controller.prototype.onNavButtonPress = function(oEvent) {
      // nav back to the top page (this is basically, a cancel action)
      var oNav = sap.ui.core.Fragment.byId("idDataTypeFragment", "idNavContainer");
      oNav.backToTop();
    };

    /**
     * Closes the dialog
     * @param  {Event} oEvent Button press event
     */
    Controller.prototype.onTypeDialogCancelPress = function(oEvent) {
      // Close
      if (this._oDefinitionDialog) {
        this._oDefinitionDialog.close();

        // nav back to front page and disable Save Button
        sap.ui.core.Fragment.byId("idDataTypeFragment", "idNavContainer").backToTop();
        sap.ui.core.Fragment.byId("idDataTypeFragment", "idTypeDialogSaveButton").setVisible(false);
      }
    };

    /**
     * Saves the date format
     * @param  {Event} oEvent Button press event
     */
    Controller.prototype.onTypeDialogSavePress = function(oEvent) {

      // we have the date format. Save it against the dimension.
      var oControl = sap.ui.core.Fragment.byId("idDataTypeFragment", "idComboBox");
      var sFormat = oControl.getSelectedItem().getText();
      if (!sFormat) {
        oControl.setValueState(sap.ui.core.ValueState.Error)
          .setValueStateText("Please pick a date format");
        return;
      } else {
        oControl.setValueState(sap.ui.core.ValueState.None)
          .setValueStateText("");

        // now we're busy
        this.showBusyDialog({});
      }

      // Collect context of pressed link, so we can get the ID of the dimension
      var link = this._oLink;
      var oContext = link.getBindingContext("dataset");
      var sId = oContext.getProperty("id");

      // We're going to test the validity of the selected pattern...
      this.testPattern(sFormat, sId, {
        valid : jQuery.proxy(function() {

          // Mark the offending items in the table
          var oTable = sap.ui.core.Fragment.byId("idDataTypeFragment", "idTable");
          oTable.clearSelection();

          // Now process the format and save
          this.getView().getModel("dataset").update("/Dimensions('" + sId + "')", { format : sFormat }, {
            merge : true,
            async : true,
            success : jQuery.proxy(function(oData, mResponse) {
              // update the link text to read the new type; ensure the original type is
              // retained
              link.setText("Date");
              var oModel = oContext.getModel();
              oModel.setProperty("type", "date", oContext, true);
              if (oModel.hasPendingChanges()) {
                oModel.submitChanges();
              }

              // Close the dialog
              this.hideBusyDialog();
              this.onTypeDialogCancelPress(null);
            }, this),
            error : jQuery.proxy(function(mError) {

              // Close the dialog
              this.hideBusyDialog();

              // error!
              this.showErrorAlert(
                "I'm really sorry, but your date formatting couldn't be saved. That's all the information I have for you.",
                "Error saving field",
                sap.ui.Device.system.phone)
            }, this)
          })
        }, this),
        invalid : jQuery.proxy(function(sMessage) {
          // Close the dialog
          this.hideBusyDialog();

          // error!
          this.showErrorAlert(
            sMessage,
            "Invalid date pattern",
            sap.ui.Device.system.phone)
        }, this)
      })

    };

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

      // Otherwise, we can show the definition pop-up and go from there.
      if (!this._oDefinitionDialog) {
        this._oDefinitionDialog = sap.ui.xmlfragment("idDataTypeFragment", "com.ffa.hpc.view.data.DimensionDataTypeDialog", this);
        this.getView().addDependent(this._oDefinitionDialog);
      }

      // Now bind the dialog to our dimension
      var link = this._oLink = oEvent.getSource();

      // Set the select key... binding didn't work
      var sType = link.getText().toLowerCase();
      var oSelectList = sap.ui.core.Fragment.byId("idDataTypeFragment", "idSelectList")
        .setSelectedKey(sType);

      // Open
      this._oDefinitionDialog.open();
    };

    /**
     * When the select item is pressed, this triggers a temporary storage of The
     * value, ready for updating when the user hits done.
     * @param  {event} oEvent Button press event
     */
    Controller.prototype.onTypeSelectChanged = function(oEvent) {

      var oItem = oEvent.getParameter("selectedItem");
      var sType = oItem.getText().toLowerCase();
      var l = this._oLink;
      var oContext = l.getBindingContext("dataset");
      var sId = oContext.getProperty("id");

      // Big and important change. We need to prompt the user for the date pattern,
      // if they are changing the type to date. Now, this is important, because
      // we couldn't automagically identify date, so the user now has to tell
      // us how to make this field a date...
      if (sType === 'date') {
        // we're going to nav to a fragment page, to take care of the Date
        // field pattern picking...
        var oNav = sap.ui.core.Fragment.byId("idDataTypeFragment", "idNavContainer");
        var oPage = sap.ui.core.Fragment.byId("idDataTypeFragment", "idDateFormatPage");

        // Okay, so we're dealing with the date field.
        // Google data is precached, and waiting for us. We now need to populate
        // the staging date table with a few entries of this new date field.
        // This can be done by calling Create on the GoogleStagingDates entity.
        this.showBusyDialog({});
        this.getView().getModel("dataset").create("/DatasetStagingDates", {
          id : 'NEWID',
          dimension_id : sId,
          created : new Date(Date.now())
        }, {
          async : true,
          success : jQuery.proxy(function(oData, mResponse) {
            oPage.bindElement("dataset>/Dimensions('" + sId + "')", {} /* oParameters */ );
            oNav.to(oPage);

            // enable the save Button
            sap.ui.core.Fragment.byId("idDataTypeFragment", "idTypeDialogSaveButton").setVisible(true);
            this.hideBusyDialog();
          }, this),
          error : jQuery.proxy(function(mError) {
            this.hideBusyDialog();
          }, this)
        });
      } else {
        // update the link text to read the new type; ensure the original type is
        // retained
        l.setText(oItem.getText());
        var oModel = oContext.getModel();
        oModel.setProperty("type", sType, oContext, true);
        if (oModel.hasPendingChanges()) {
          oModel.submitChanges();
        }

        // Close the dialog
        this.onTypeDialogCancelPress(null);
      }
    };

    /***
     *    ███████╗ █████╗ ██╗   ██╗███████╗
     *    ██╔════╝██╔══██╗██║   ██║██╔════╝
     *    ███████╗███████║██║   ██║█████╗
     *    ╚════██║██╔══██║╚██╗ ██╔╝██╔══╝
     *    ███████║██║  ██║ ╚████╔╝ ███████╗
     *    ╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝
     *
     */

    /**
     * Grab the select item from the definition table, and make sure it is of
     * type Date. If not, then prompt the user to select. Note, we are comparing
     * the text of the Link control within the table's row items, as this is
     * a true reflection of the intended field type
     * @param {Function} fnSuccess The callback for success
     * @param {Function} fnError   The callback for error
     */
    Controller.prototype.saveDateField = function(fnSuccess, fnError) {
      var oTable = this.getView().byId(
        sap.ui.core.Fragment.createId("idFieldsFragment", "idFieldsTable")
      );

      // get the selected item, and check its type is Date
      var aItems = oTable.getSelectedItems() || [];
      if (aItems.length < 1) {
        this.showErrorAlert(
          "You must first select a Date field before continuing",
          "Select date field",
          sap.ui.Device.system.phone
        );

        // Return, calling callback
        return fnError(null);
      }

      // else, we deal with the first item only
      var oRow = aItems[0];

      // use the item's text to check, as the item may have changed type before
      // saving, and we haven't yet persisted to the model. The link Control
      // is the second in the list of items
      var aCells = oRow.getCells();
      var sType = "";
      aCells.forEach(function(control, index) {
        if (control instanceof sap.m.Link) {
          sType = control.getText().toLowerCase();
          return;
        }
      }, this);

      // Now we have the type. Let's make sure it's Date
      if (sType !== 'date') {
        this.showErrorAlert(
          "The selected field is not of type Date. Please only select fields marked as type Date",
          "Invalid Date field",
          sap.ui.Device.system.phone
        );

        // Return calling callback
        return fnError(null);
      }

      // Now we save the date field...
      var sPath = "/Dimensions('" + oRow.getBindingContext("dataset").getProperty("id") + "')";
      var oModel = this.getView().getModel("dataset").update(sPath, {
        is_date: "X"
      }, {
        merge: true,
        async: true,
        success: fnSuccess,
        error: jQuery.proxy(function(mError) {
          // hide busy
          this.hideBusyDialog();

          // show error Alert
          this.showErrorAlert(
            "Yikes. There was a problem saving your data set. I have no more information for you.",
            "Error saving data set",
            sap.ui.Device.system.phone
          );

          // maybe handle auth error
          this._maybeHandleAuthError(mError);

          // if supplied, call the error callback
          if (fnError !== undefined) {
            if (typeof fnError === "function") {
              fnError(mError);
            }
          }
        }, this)
      });
    };

    /***
     *    ██████╗ ███████╗██╗     ███████╗████████╗███████╗
     *    ██╔══██╗██╔════╝██║     ██╔════╝╚══██╔══╝██╔════╝
     *    ██║  ██║█████╗  ██║     █████╗     ██║   █████╗
     *    ██║  ██║██╔══╝  ██║     ██╔══╝     ██║   ██╔══╝
     *    ██████╔╝███████╗███████╗███████╗   ██║   ███████╗
     *    ╚═════╝ ╚══════╝╚══════╝╚══════╝   ╚═╝   ╚══════╝
     *
     */

    /**
     * Deletes a recently created data set
     * @param  {String} sId [description]
     * @param  {Deferred} oPromise [description]
     */
    Controller.prototype.delete = function(sId, oPromise) {
      if (!sId) {
        return;
      }
      this.getView().getModel("dataset").remove("/DataSets('" + sId + "')", {
        success: jQuery.proxy(function(oData, mResponse) {
          oPromise.resolve();
        }, this),
        error: jQuery.proxy(function(mError) {
          oPromise.resolve();
        }, this)
      });
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

    Controller.prototype.testPattern = function (sPattern, sId, oCallbacks) {
      // Luckily for us, the view binding has pulled through about 20 date Values
      // we can test against.
      var oTable = sap.ui.core.Fragment.byId("idDataTypeFragment", "idTable");
      var aRows = oTable.getRows();
      var bValid = true;
      jQuery.sap.require("com.ffa.hpc.thirdparty.momentjs.Momentjs");
      aRows.forEach(function (row, index) {
        var oContext = row.getBindingContext("dataset");
        var sDate = oContext.getProperty("date");

        // test validity of the date string, against the supplied pattern
        if (!moment(sDate, sPattern, true /* bStrict */).isValid()) {
          // there only needs to be one invalid date parsing for the whole thing to fail.
          bValid = false;
        }
      }, this);

      // Now we decide what to do...
      if (bValid) {
        oCallbacks.valid();
      } else {
        // For any invalids, call the callback, with a message and the offending dates (as indexes to the table)
        oCallbacks.invalid("One or more of your dates did not match the pattern '" + sPattern + "'");
      }
    };
  });
