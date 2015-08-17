sap.ui.define(["jquery.sap.global", "sap/ui/core/Control", "./library", "./Source"],
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
            defaultValue: "thirdparty.charts.ChartJsType.Line"
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
     * After rendering event; this is leveraged, in the case of ChartJs, to
     * set the canvas dimensions. THe page in which this is displayed does
     * some height/width resizing of it"s own, after rendering, to this control
     * must subsequently wait even longer, to get it"s own height and width.
     * @param  {object} oEvent After rendering event
     */
    ChartJs.prototype.onAfterRendering = function(oEvent) {
      var jThis = this.$()[0];
      var oParent = jQuery(jThis).parent()[0];
      var oSizePromise = jQuery.Deferred();

      // When the promise is resolved, we can create the chart
      jQuery.when(oSizePromise).then(jQuery.proxy(function() {
        // This will get the first returned node in the jQuery collection.
        var ctx = jThis.getContext("2d");
        this._chart = new Chart(ctx).Line(this._data, {
          bezierCurve: true
        });
      }, this));

      // Perform size detection
      this._waitForSize(jThis, oParent, oSizePromise);
    };

    /**
     * Helper function for the after rendering size determination. This is
     * called recursively, until the size of the container it"s checking is
     * available.
     * @param  {[type]} oCanvas    [description]
     * @param  {[type]} oContainer [description]
     * @param  {[type]} oPromise   [description]
     */
    ChartJs.prototype._waitForSize = function(oCanvas, oContainer, oPromise) {
      if (oContainer.clientHeight < 100) {
        // waiting for height
        setTimeout(jQuery.proxy(function() {
          this._waitForSize(oCanvas, oContainer, oPromise);
        }, this), 500);
      } else {
        jQuery(oCanvas).width(oContainer.clientWidth-32)
                      .height(oContainer.clientHeight-50);
        oPromise.resolve();
      }
    };

    return ChartJs;
  }, /* bExport */ true);
