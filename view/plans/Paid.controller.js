jQuery.sap.declare("view.plans.Paid");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'view/plans/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Paid = Controller.extend("view.plans.Paid", /** @lends view.plans.Lite.prototype */ {
      _sPlanId: "",
      _initd: false,
      _oPromise: jQuery.Deferred()
    });

    /**
     * On init handler
     */
    Paid.prototype.onInit = function() {
      // Handle route matching.
      this.getRouter().getRoute("plan-lite").attachPatternMatched(this._onRouteMatched, this);
      this.getRouter().getRoute("plan-pro").attachPatternMatched(this._onRouteMatched, this);
    };

    /**
     * On exit handler
     */
    Paid.prototype.onExit = function() {};

    /**
     * On before rendering; add in our 'New region' tile
     * at the beginning of the tile container
     */
    Paid.prototype.onBeforeRendering = function() {};

    /**
     * On after rendering - the DOM is now built. Add in our 'New region' tile
     * at the beginning of the tile container
     */
    Paid.prototype.onAfterRendering = function() {};

    /**
     * Route matched handler...
     */
    Paid.prototype._onRouteMatched = function(oEvent) {
      let oParams = oEvent.getParameters();

      // bind the nav container to a particular checkout item
      let sPath = "";
      if ("plan-lite" === oParams.name) {
        this._sPlanId = 'lite';
        sPath = "settings>/PlanTypes('lite')";
      } else if ("plan-pro" === oParams.name) {
        this._sPlanId = 'pro'
        sPath = "settings>/PlanTypes('pro')";
      }

      // Bind split container to our plan type
      this.getView().byId("idPaidPlanSplitContainer").bindElement(sPath);

      // Try and bind to some of the basic form fields.
      let oView = this.getView();
      oView.byId("idBillingDetailsForm").bindElement("settings>/Profiles('TESTUSER')", {
        mode: "OneWay"
      });
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
     * Nav back to plans to pick another one
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Paid.prototype.onCancelPress = function(oEvent) {
      this.getRouter().navTo("plans", {}, !sap.ui.Device.system.phone);
      this.onClearPress(null);
    };

    /**
     * Nav back to billing details page
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Paid.prototype.onBackPress = function (oEvent) {
      this.getView().byId("idPaidPlanSplitContainer").backDetail();
    };

    /***
     *    ██████╗ ██╗██╗     ██╗     ██╗███╗   ██╗ ██████╗
     *    ██╔══██╗██║██║     ██║     ██║████╗  ██║██╔════╝
     *    ██████╔╝██║██║     ██║     ██║██╔██╗ ██║██║  ███╗
     *    ██╔══██╗██║██║     ██║     ██║██║╚██╗██║██║   ██║
     *    ██████╔╝██║███████╗███████╗██║██║ ╚████║╚██████╔╝
     *    ╚═════╝ ╚═╝╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝
     *
     */

    /**
     * Gets all controls that make up the form
     * @return {[type]} [description]
     */
    Paid.prototype._getFormControls = function() {
      let oView = this.getView();
      return [
        oView.byId("idFirstNameInput"),
        oView.byId("idLastNameInput"),
        oView.byId("idCompanyInput"),
        oView.byId("idEmailInput"),
        oView.byId("idPhoneInput"),
        oView.byId("idStreet1Input"),
        oView.byId("idStreet2Input"),
        oView.byId("idRegionInput"),
        oView.byId("idPostCodeInput"),
        oView.byId("idCountryCodeComboBox"),
      ];
    };

    /**
     * Clears all controls
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Paid.prototype.onClearPress = function(oEvent) {
      let aControls = this._getFormControls();
      jQuery.each(aControls, function(index, control) {
        control.setValue("");
      });
    };

    /**
     * Validate the contents of the Billing details form. Then proceed
     * to the Braintree payments page with T&Cs
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Paid.prototype.onNextPress = function(oEvent) {

      let aControls = this._getFormControls();

      // only change continue on exceptions
      let bContinue = true;

      jQuery.each(aControls, jQuery.proxy(function(index, control) {
        let bIsCombo = (typeof control.getSelectedKey === 'function');

        if ('true' === control.data("required") && (sap.ui.core.ValueState.Error === control.getValueState() || control.getValue() === "")) {
          // Set the control to error state
          control.setValueState(sap.ui.core.ValueState.Error);
          if (bIsCombo) {
            control.setValueStateText("Invalid country");
          } else {
            control.setValueStateText("Required");
          }
          bContinue = false;
        }
      }, this));

      // Now we collect details and advance...
      if (!bContinue) {
        return;
      }

      // Nav to next page.
      let oSplit = this.getView().byId("idPaidPlanSplitContainer");

      // attach to the after detail navigate event of the split container and
      // Load up the payment form, if necessary
      oSplit.attachAfterDetailNavigate({}, this.afterDetailNavigate,  this);
      oSplit.toDetail(this.getView().byId("idPaymentDetailsPage"));
    };

    /**
     * Once we navigated to the payments page, detach the nav handler from The
     * splitcontainer. We don't want to listen any more, as we've already init'd
     * the payments form.
     * @param  {[type]} oEvent  [description]
     * @return {[type]}         [description]
     */
    Paid.prototype.afterDetailNavigate = function (oEvent) {
      this.showBusyDialog();
      this._maybeInitPayment();
      oEvent.getSource().detachAfterDetailNavigate(this.afterDetailNavigate, this);
    };

    /***
     *    ██████╗  █████╗ ██╗   ██╗███╗   ███╗███████╗███╗   ██╗████████╗
     *    ██╔══██╗██╔══██╗╚██╗ ██╔╝████╗ ████║██╔════╝████╗  ██║╚══██╔══╝
     *    ██████╔╝███████║ ╚████╔╝ ██╔████╔██║█████╗  ██╔██╗ ██║   ██║
     *    ██╔═══╝ ██╔══██║  ╚██╔╝  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║
     *    ██║     ██║  ██║   ██║   ██║ ╚═╝ ██║███████╗██║ ╚████║   ██║
     *    ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝
     *
     */

    /**
     * Maybe initialise the payment form. Do not do this, if already init'd.
     * @return {[type]} [description]
     */
    Paid.prototype._maybeInitPayment = function() {

      // Don't do it twice
      if (this._initd) {
        this.hideBusyDialog();
        return;
      }

      // Load up the Braintree JS
      jQuery.when(this._oPromise).then(jQuery.proxy(function() {

        // Now set up the payment with Braintree Server using our supplied clientToken
        braintree.setup(this._getClientToken(), "dropin", {
          container: this.getView().createId("idBrainTreeDropInDiv"),
          paymentMethodNonceReceived: jQuery.proxy(function(event, nonce) {

            // Don't let the form submit
            event.preventDefault();

            // submit the payment to Node
            this._submitPayment(
              nonce,
              this.getView().getModel("settings").getProperty("/Profiles('" + this.getUserId() + "')/customer_id"),
              event.srcElement.action || event.target.action /* Form action URL */
            );
          }, this),
          onPaymentMethodReceived: jQuery.proxy(function(nonce, type, details) {

          }, this),
          onReady: jQuery.proxy(function() {
            let j = 1;
          }, this),
          onError: jQuery.proxy(function(oEvent) {
            let i = 1;
          }, this)
        });
        this.hideBusyDialog();
      }, this));

      // Load the script
      if ('resolved' !== this._oPromise.state()) {
        jQuery.sap.includeScript(
          "https://js.braintreegateway.com/v2/braintree.js",
          "braintree",
          jQuery.proxy(function() { /* loaded callback */
            this._oPromise.resolve();
          }, this),
          jQuery.proxy(function() { /* failed callback */
            this.hideBusyDialog();
          }, this)
        );
      }

      // Set flag-
      this._initd = true;
    };

    /**
     * Payment submitted. Submit the Braintree form
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Paid.prototype.onSubmitPaymentPress = function(oEvent) {

      // We're now busy! This dialog must be closed once the Payment form has
      // completed processing.
      this.openBusyDialog({
        title: "Processing",
        text: "Thanks. Just processing your subscription. Won't be long.",
        showCancelButton: false
      });

      let eForm = this.getView().byId("idBraintreeDropInForm").$()[0];

      // set correct action
      eForm.action = "/payments/pro"
      if ('lite' === this._sPlanId) {
        eForm.action = "/payments/lite"
      }

      // Press button
      jQuery(eForm[0] /* Button */ ).click();
    };

    /***
     *    ██████╗ ██████╗  ██████╗  ██████╗███████╗███████╗███████╗██╗███╗   ██╗ ██████╗
     *    ██╔══██╗██╔══██╗██╔═══██╗██╔════╝██╔════╝██╔════╝██╔════╝██║████╗  ██║██╔════╝
     *    ██████╔╝██████╔╝██║   ██║██║     █████╗  ███████╗███████╗██║██╔██╗ ██║██║  ███╗
     *    ██╔═══╝ ██╔══██╗██║   ██║██║     ██╔══╝  ╚════██║╚════██║██║██║╚██╗██║██║   ██║
     *    ██║     ██║  ██║╚██████╔╝╚██████╗███████╗███████║███████║██║██║ ╚████║╚██████╔╝
     *    ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚══════╝╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝
     *
     */

    Paid.prototype._submitPayment = function(sNonce, sCustomerId, sUrl) {

      // Build payload
      let oPayload = {
        payment_method_nonce: sNonce,
        customerId: sCustomerId
      };

      // Now append form controls
      let aControls = this._getFormControls();
      jQuery.each(aControls, function(index, control) {
        oPayload[control.getName()] = (typeof control.getSelectedKey === 'function' ? control.getSelectedKey() : control.getValue());
      });

      jQuery.ajax({
        url: sUrl,
        type: 'POST',
        headers: this.getJqueryHeader(),
        data: oPayload,
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {

          // Create the link in our model (Controller)
          this._createProfilePlanLink(this.getProfileId(), this._sPlanId);

          // We're now busy! This dialog must be closed once the Payment form has
          // completed processing.
          this.updateBusyDialog({
            title: "Done",
            text: "Bing! Your subscription is active. Cancel any time from your profile page."
          });

          // nav to dash page
          jQuery.sap.delayedCall(1500, this, function() {
            this.getRouter().navTo("dash", {}, !sap.ui.Device.system.phone);
          }, []);
        }, this),
        error: jQuery.proxy(function(mError) {

        }, this)
      });
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
     * Returns a List item grouping, for the datasets list
     * @param  {object} oGroup The object group, as identified by the list
     *                         binding parameters
     */
    Paid.prototype.getCheckoutGroupHeader = function(oGroup) {
      return new sap.m.GroupHeaderListItem({
        title: oGroup.key,
        upperCase: false
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
     * Validate the country exists, and that a key is selected.
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Paid.prototype.onChangeValidateCountry = function(oEvent) {
      let oItem = oEvent.getParameter("selectedItem");
      let oCombo = oEvent.getSource();
      if (oCombo.getValueState() === sap.ui.core.ValueState.Error || oItem === null) {
        oCombo.setValueState(sap.ui.core.ValueState.None);
      }
    };

    /**
     * Validate the field is populated
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Paid.prototype.onChangeValidatePopulated = function(oEvent) {
      let oControl = oEvent.getSource();
      let sValue = oEvent.getParameter("value");

      if (sValue !== "") {
        oControl.setValueState(sap.ui.core.ValueState.None);
      } else {
        oControl.setValueState(sap.ui.core.ValueState.Error);
      }
    };

    /**
     * Validate the email is an email
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Paid.prototype.onChangeValidateEmail = function(oEvent) {
      let oControl = oEvent.getSource();
      let sValue = oEvent.getParameter("value");
      if (sValue) {
        if (this._validateEmail(sValue) && oControl.getValueState() === sap.ui.core.ValueState.Error) {
          oControl.setValueState(sap.ui.core.ValueState.None);
        } else {
          oControl.setValueState(sap.ui.core.ValueState.Error);
        }
      } else {
        oControl.setValueState(sap.ui.core.ValueState.Error);
      }
    };

    return Paid;

  }, /* bExport= */ true);
