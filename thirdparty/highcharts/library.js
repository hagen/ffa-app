jQuery.sap.require("thirdparty.highcharts.Highcharts");
jQuery.sap.require("thirdparty.highcharts.Highcharts-more");
jQuery.sap.require("thirdparty.highcharts.modules.NoData");
jQuery.sap.require("thirdparty.highcharts.modules.Exporting");
jQuery.sap.require("thirdparty.highcharts.plugins.TooltipDelay");
jQuery.sap.require("thirdparty.highcharts.plugins.ShiftSelectPoints");
//jQuery.sap.require("thirdparty.highcharts.plugins.LegendYAxis"); // load this optionally

sap.ui.define(["jquery.sap.global", "sap/ui/Device", "sap/ui/core/library", "jquery.sap.mobile" ],
	function(jQuery, Device) {

	"use strict";

  // delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name : "thirdparty.highcharts",
		version: "1.0",
		dependencies : ["sap.m"],
		types: [
    ],
    controls: [
			"thirdparty.highcharts.Highcharts"
    ]
  });

	/**
	 * Types of the Chart
	 */
	thirdparty.chartjs.ChartJsType = {
		Line : "Line"
	};

	return thirdparty.chartjs;

});
