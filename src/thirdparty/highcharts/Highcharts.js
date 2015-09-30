sap.ui.define(["jquery.sap.global", "sap/ui/core/Control", "./library"],
  function(jQuery, Control, library, Js) {
    "use strict";

    var Highcharts = Control.extend("com.ffa.hpc.thirdparty.highcharts.Highcharts", {
      metadata: {
        library: "com.ffa.hpc.thirdparty.highcharts"
      }
    });

    return Highcharts;
  }, /* bExport */ true);
