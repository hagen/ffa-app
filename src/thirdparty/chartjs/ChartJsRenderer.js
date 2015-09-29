sap.ui.define(['jquery.sap.global'],
  function(jQuery) {
    "use strict";

    var ChartJsRenderer = {};

    ChartJsRenderer.render = function(oRm, oControl) {

      oRm.write("<canvas");
      oRm.writeControlData(oControl);
      oRm.write(">");
      oRm.write("</canvas>");
    };

    return ChartJsRenderer;

  }, /* bExport= */ true);
