jQuery.sap.require("thirdparty.highcharts.js.Highcharts");
jQuery.sap.require("thirdparty.highcharts.js.Highcharts-more");
jQuery.sap.require("thirdparty.highcharts.js.modules.NoData");
jQuery.sap.require("thirdparty.highcharts.js.plugins.TooltipDelay");
jQuery.sap.require("thirdparty.highcharts.js.modules.Exporting");
jQuery.sap.require("thirdparty.highcharts.js.plugins.ShiftSelectPoints");
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

	return thirdparty.highcharts;
});
