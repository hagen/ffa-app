sap.ui.define(['jquery.sap.global', 'sap/ui/core/Control', './library', './Source'],
  function(jQuery, Control, library, Js) {
    "use strict";

    var ChartJs = Control.extend("thirdparty.chartjs.ChartJs", {
      metadata: {
        library: "thirdparty.chartjs",
        properties: {
          width: {
            type: "sap.ui.core.CSSSize",
            group: "Misc",
            defaultValue: "100%"
          },
          height: {
            type: "sap.ui.core.CSSSize",
            group: "Misc",
            defaultValue: "100%"
          },
          type: {
            type: "thirdparty.chartjs.ChartJsType",
            group: "Misc",
            defaultValue: thirdparty.charts.ChartJsType.Line
          }
        },
        //defaultAggregation : "points",
        aggregations: {
          //"points" : { type : "controls.ffa.ChartJsPoint", multiple : true, singularName : "point", bindable : "bindable" }
        }
      }
    });

    /**
     * Initialise the Chart control
     */
    ChartJs.prototype.init = function() {
      this._data = {
        labels: ["January", "February", "March", "April", "May", "June", "July"],
        datasets: [{
          label: "My First dataset",
          fillColor: "rgba(220,220,220,0.2)",
          strokeColor: "rgba(220,220,220,1)",
          pointColor: "rgba(220,220,220,1)",
          pointStrokeColor: "#fff",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "rgba(220,220,220,1)",
          data: [65, 59, 80, 81, 56, 55, 40]
        }, {
          label: "My Second dataset",
          fillColor: "rgba(151,187,205,0.2)",
          strokeColor: "rgba(151,187,205,1)",
          pointColor: "rgba(151,187,205,1)",
          pointStrokeColor: "#fff",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "rgba(151,187,205,1)",
          data: [28, 48, 40, 19, 86, 27, 90]
        }]
      };
    };

    /**
     * After rendering event
     * @param  {[type]} oEvent [description]
     * @return {[type]}        [description]
     */
    ChartJs.prototype.onAfterRendering = function(oEvent) {
      var ctx = this.$().getContext("2d");
      // This will get the first returned node in the jQuery collection.
      this._chart = new Chart(ctx).Line(this._data {
        bezierCurve: true
      });
    };

    return ChartJs;
  }, /* bExport */ true);
