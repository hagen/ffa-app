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
            defaultValue: thirdparty.chartjs.ChartJsType.Line
          },
          /** late load prevents loading of the chart until programmatically requested */
          lateLoad: {
            type: "boolean",
            group: "Misc",
            defaultValue: "false"
          }
        },
        defaultAggregation: "datasets",
        aggregations: {
          "labels": {
            type: "thirdparty.chartjs.Label",
            mulitple: true,
            singluarName: "label",
            bindable: "bindable"
          },
          "datasets": {
            type: "thirdparty.chartjs.Dataset",
            multiple: true,
            singularName: "dataset",
            bindable: "bindable"
          }
        }
      }
    });

    /**
     * Initialise the Chart control; resize handler is initiaied.
     */
    ChartJs.prototype.init = function() {
      // Resize handler!
      this.sResizeListenerId = null;
      if (jQuery.device.is.desktop) {
        this.sResizeListenerId = sap.ui.core.ResizeHandler.register(this, jQuery.proxy(this._adjustSize, this));
      } else {
        sap.ui.Device.orientation.attachHandler(this._adjustSize, this);
        sap.ui.Device.resize.attachHandler(this._adjustSize, this);
      }
    };

    /**
     * Detach the resize handler
     */
    ChartJs.prototype.exit = function() {
      if (jQuery.device.is.desktop && this.sResizeListenerId) {
        sap.ui.core.ResizeHandler.deregister(this.sResizeListenerId);
        this.sResizeListenerId = null;
      } else {
        sap.ui.Device.orientation.detachHandler(this._adjustSize, this);
        sap.ui.Device.resize.detachHandler(this._adjustSize, this);
      }
    };

    /**
     * {description}
     * @param  {[type]} oEvent [description]
     */
    ChartJs.prototype.onBeforeRendering = function(oEvent) { };

    /**
     * After rendering event; this is leveraged, in the case of ChartJs, to
     * set the canvas dimensions. THe page in which this is displayed does
     * some height/width resizing of it"s own, after rendering, to this control
     * must subsequently wait even longer, to get it"s own height and width.
     * @param  {object} oEvent After rendering event
     */
    ChartJs.prototype.onAfterRendering = function(oEvent) {
      var oCanvas = this.$()[0];
      var oParent = jQuery(oCanvas).parent()[0];
      var oSizePromise = jQuery.Deferred();

      // When the promise is resolved, we can create the chart
      jQuery.when(oSizePromise).then(jQuery.proxy(function() {
        // This will get the first returned node in the jQuery collection.
        var ctx = oCanvas.getContext("2d");
        this._chart = this._build(ctx);
      }, this));

      // Perform size detection
      this._waitForSize(oCanvas, oParent, oSizePromise);
    };

    /**
     * Convert dataset controls to data!
     * @param  {Array} aLabels Data sets controls
     * @return {Array}         Array of dataset objects
     */
    ChartJs.prototype.datasetsToData = function(aDatasets) {
      //
      var oModel = this.getModel();

      // Loop at datasets and load data...
      var a = [];
      jQuery.each(aDatasets, function(index, d) {
        d.load(oModel);
        a.push({
          label: d.getLabel(),
          fillColor: d.getFillColor(),
          strokeColor: d.getStrokeColor(),
          pointColor: d.getPointColor(),
          pointStrokeColor: d.getPointStrokeColor(),
          pointHighlightFill: d.getPointHighlightFill(),
          pointHighlightStroke: d.getPointHighlightStroke(),
          data: d._data
        });
      });
      return a;
    };

    /**
     * Convert labels to an array of strings
     * @param  {Array} aLabels Label controls
     * @return {Array}         Array of string label names
     */
    ChartJs.prototype.labelsToData = function(aLabels) {

      var a = [];
      jQuery.each(aLabels, function(index, label) {
        a.push(label.getText());
      });
      return a;
    };

    /**
     * Builds and returns the chart JS style data.
     * @return {[type]} [description]
     */
    ChartJs.prototype.toData = function() {
      return {
        labels: this.labelsToData(this.getLabels()),
        datasets: this.datasetsToData(this.getDatasets())
      };
    };

    /**
     * Build the chart, and it's datasets
     * @param  {[type]} oContext [description]
     * @return {[type]}          [description]
     */
    ChartJs.prototype._build = function(oContext) {

      // If I have no datasets, do not render.
      if (this.getDatasets().length === 0) {
        return;
      }

      // Otherwise, continue on
      return new Chart(oContext)[this.getType()](this.toData(), {
        bezierCurve: true
      });
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
        // Update the canvas size
        this._resolveCanvasSize(oCanvas, oContainer);
        oPromise.resolve();
      }
    };

    /**
     * Auto adjustment of the chart size. Requires a redraw.
     * @param  {object} oEvent Browser resize event
     */
    ChartJs.prototype._adjustSize = function(oEvent) {
      var oCanvas = this.$()[0];
      var oContainer = jQuery(oCanvas).parent()[0];

      // Update the canvas size
      this._resolveCanvasSize(oCanvas, oContainer);

      // redraw the chart
      if (this._chart) {
        this._chart.update();
      }
    };

    /**
     * Sets the canvas size to be similar to that of it's containing parent
     * @param  {[type]} oCanvas    [description]
     * @param  {[type]} oContainer [description]
     */
    ChartJs.prototype._resolveCanvasSize = function(oCanvas, oContainer) {
      jQuery(oCanvas).width(oContainer.clientWidth - 32)
        .height(oContainer.clientHeight - 50);
    };

    return ChartJs;
  }, /* bExport */ true);
