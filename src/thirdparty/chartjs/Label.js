sap.ui.define(["jquery.sap.global", "sap/ui/core/Control", "./library"],
  function(jQuery, Control, library) {
    "use strict";

    var Label = Control.extend("thirdparty.chartjs.Label", {
      metadata: {
        library: "thirdparty.chartjs",
        properties: {
          text : { type : "string", group : "Misc", defaultValue : null }
        }
      }
    });

    return Label;
    
  }, /* bExport */ true);
