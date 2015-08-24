sap.ui.define(["jquery.sap.global", "sap/ui/core/Control", "./library"],
  function(jQuery, Control, library, Js) {
    "use strict";

    var Highcharts = Control.extend("thirdparty.highcharts.Highcharts", {
      metadata: {
        library: "thirdparty.highcharts"
      }
    });

    return Highcharts;
  }, /* bExport */ true);
