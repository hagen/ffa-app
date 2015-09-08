jQuery.sap.declare("view.data.Controller");
// Require the short Id gen library
jQuery.sap.require("thirdparty.shortid.ShortId");

// Provides controller util.Controller
sap.ui.define(["jquery.sap.global", "com/ffa/dash/util/Controller"],
  function(jQuery, UtilController) {
    "use strict";

    var Controller = UtilController.extend("view.data.Controller", /** @lends view.data.Controller */ {

    });

    /**
     * Collect the control
     * @param  {[type]} sId [description]
     * @return {[type]}     [description]
     */
    Controller.prototype._control = function(sId) {
      return this.getView().byId(sId);
    };

    /**
     * Collect the control's value.
     * @param  {[type]} sId [description]
     * @return {[type]}     [description]
     */
    Controller.prototype._value = function (sId) {
      let oControl = this._control(sId);
      if (oControl instanceof sap.m.CheckBox) {
        return (oControl.getSelected() ? 'X' : ' ');
      } else if (oControl instanceof sap.m.Select){
        return oControl.getSelectedKey();
      } else {
        return oControl.getValue();
      }
    };
  });
