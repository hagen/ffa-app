jQuery.sap.declare("view.plans.Paid");

// Provides controller view.Plans
sap.ui.define(['jquery.sap.global', 'view/plans/Controller'],
  function(jQuery, Controller) {
    "use strict";

    var Paid = Controller.extend("view.plans.Paid", /** @lends view.plans.Lite.prototype */ {
      _sPlanId: "",
      _initd: false,
      _isChange: false,
      _oPromise: jQuery.Deferred()
    });

    /**
     * On init handler
     */
    Paid.prototype.onInit = function() {
      // Handle route matching.
      this.getRouter().getRoute("plan-lite").attachPatternMatched(this._onRouteMatched, this);
      this.getRouter().getRoute("plan-pro").attachPatternMatched(this._onRouteMatched, this);

      this.getRouter().getRoute("change-plan-lite").attachPatternMatched(this._onChangeRouteMatched, this);
      this.getRouter().getRoute("change-plan-pro").attachPatternMatched(this._onChangeRouteMatched, this);
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
      var oParams = oEvent.getParameters();

      // bind the nav container to a particular checkout item
      var sPath = "";
      if (oParams.name.indexOf("plan-lite") > -1) {
        this._sPlanId = 'lite';
        sPath = "profile>/PlanTypes('lite')";
      } else if (oParams.name.indexOf("plan-pro") > -1) {
        this._sPlanId = 'pro'
        sPath = "profile>/PlanTypes('pro')";
      }

      // Bind split container to our plan type
      this.getView().byId("idPaidPlanSplitContainer").bindElement(sPath);

      // Try and bind to some of the basic form fields.
      var oView = this.getView();
      oView.byId("idBillingDetailsForm").bindElement("profile>/Profiles('TESTUSER')", {
        mode: "OneWay"
      });
    };

    /**
     * Route matched handler...
     */
    Paid.prototype._onChangeRouteMatched = function(oEvent) {

      this._isChange = true;
      this._onRouteMatched(oEvent);
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

      // If this is a change to an existing account, then nav back to the plans
      // change screen, not the plans new screen
      var sRoute = (this._isChange ? "change-plan" : "plans");
      this.getRouter().navTo(sRoute, {}, !sap.ui.Device.system.phone);
      this.onClearPress(null);
    };

    /**
     * Nav back to billing details page
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    Paid.prototype.onBackPress = function(oEvent) {
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
      var oView = this.getView();
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
      var aControls = this._getFormControls();
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

      var aControls = this._getFormControls();

      // only change continue on exceptions
      var bContinue = true;

      jQuery.each(aControls, jQuery.proxy(function(index, control) {
        var bIsCombo = (typeof control.getSelectedKey === 'function');

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
      var oSplit = this.getView().byId("idPaidPlanSplitContainer");

      // attach to the after detail navigate event of the split container and
      // Load up the payment form, if necessary
      oSplit.attachAfterDetailNavigate({}, this.afterDetailNavigate, this);
      oSplit.toDetail(this.getView().byId("idPaymentDetailsPage"));
    };

    /**
     * Once we navigated to the payments page, detach the nav handler from The
     * splitcontainer. We don't want to listen any more, as we've already init'd
     * the payments form.
     * @param  {[type]} oEvent  [description]
     * @return {[type]}         [description]
     */
    Paid.prototype.afterDetailNavigate = function(oEvent) {
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

            // Don't var the form submit
            event.preventDefault();

            // submit the payment to Node
            this._submitPayment(
              nonce,
              this.getView().getModel("profile").getProperty("/Profiles('" + this.getUserId() + "')/customer_id"),
              event.srcElement.action || event.target.action /* Form action URL */
            );
          }, this),
          onPaymentMethodReceived: jQuery.proxy(function(nonce, type, details) {

          }, this),
          onReady: jQuery.proxy(function() {
            var j = 1;
          }, this),
          onError: jQuery.proxy(function(oEvent) {
            var i = 1;
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

      var eForm = this.getView().byId("idBraintreeDropInForm").$()[0];

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
      var oPayload = {
        payment_method_nonce: sNonce,
        customerId: sCustomerId
      };

      // Now append form controls
      var aControls = this._getFormControls();
      jQuery.each(aControls, function(index, control) {
        oPayload[control.getName()] = (typeof control.getSelectedKey === 'function' ? control.getSelectedKey() : control.getValue());
      });

      jQuery.ajax({
        url: sUrl,
        type: 'POST',
        headers: this.getJqueryHeaders(),
        data: oPayload,
        async: false,
        success: jQuery.proxy(function(oData, mResponse) {

          // Create the link in our model (Controller)
          this._createProfilePlanLink(this.getProfileId(), oData.subscription.id, this._sPlanId);

          // We're now busy! This dialog must be closed once the Payment form has
          // completed processing.
          this.updateBusyDialog({
            title: "Done",
            text: "Bing! Your subscription is active. Cancel any time from your profile page."
          });

          // nav to dash page
          jQuery.sap.delayedCall(1500, this, function() {
            this.getRouter().navTo(this._isChange ? "account" : "dash", {}, !sap.ui.Device.system.phone);
            this.hideBusyDialog();
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
      var oItem = oEvent.getParameter("selectedItem");
      var oCombo = oEvent.getSource();
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
      var oControl = oEvent.getSource();
      var sValue = oEvent.getParameter("value");

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
      var oControl = oEvent.getSource();
      var sValue = oEvent.getParameter("value");
      if (sValue) {
        if (this._validateEmail(sValue)) {
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
