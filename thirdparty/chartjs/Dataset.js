sap.ui.define(["jquery.sap.global", "sap/ui/core/Control", "./library"],
  function(jQuery, Control, library) {
    "use strict";

    var Dataset = Control.extend("thirdparty.chartjs.Dataset", {
      metadata: {
        library: "thirdparty.chartjs",
        properties: {
          label : { type : "string", group : "Misc", defaultValue : "Axis label" },
          value : { type : "string", group : "Misc", defaultValue : null },
          fillColor : { type : "sap.ui.core.CSSColor", group : "Misc", defaultValue : "rgba(220,220,220,0.2)" },
          strokeColor : { type : "sap.ui.core.CSSColor", group : "Misc", defaultValue : "rgba(220,220,220,1)" },
          pointColor : { type : "sap.ui.core.CSSColor", group : "Misc", defaultValue : "rgba(220,220,220,1)" },
          pointStrokeColor : { type : "sap.ui.core.CSSColor", group : "Misc", defaultValue : "#ffffff" },
          pointHighlightFill : { type : "sap.ui.core.CSSColor", group : "Misc", defaultValue : "#ffffff" },
          pointHighlightStroke : { type : "sap.ui.core.CSSColor", group : "Misc", defaultValue : "rgba(220,220,220,0.2)" }
        },
        aggregations : {
          data : { type : "sap.ui.core.Element", multiple : true, singularName : "data", bindable : "bindable" }
        }
      }
    });

    /**
     * Enable bindign to data aggregation without a template factory
     * @return {[type]} [description]
     */
    thirdparty.chartjs.Dataset.getMetadata().getAllAggregations()["data"]._doesNotRequireFactory = true;

    /**
     * Initialise the Chart control
     */
    Dataset.prototype.init = function() {
      this._data = [];
    };

    Dataset.prototype.onAfterRendering = function(oEvent) {

    };

    Dataset.prototype.load = function(oModel) {

      var oBinding = this.getBinding("data");
      try {
        oModel.read(oBinding.getPath(), {
          filters : oBinding.aApplicationFilters,
          sorter : oBinding.aSorters,
          context : oBinding,
          success : jQuery.proxy(function(oData, mResponse) {
            jQuery.each(oData.results, jQuery.proxy(function(i, v) {
              this._data.push(v[this.getValue()]);
            }, this));
          }, this),
          error : jQuery.proxy(function(mError) {
            this._data = [];
          }, this)
        });
      } catch(e) {
         var i = 0;
      }
    };

    return Dataset;

  }, /* bExport */ true);
