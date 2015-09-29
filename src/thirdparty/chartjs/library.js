sap.ui.define(["jquery.sap.global", "sap/ui/Device", "sap/ui/core/library", "jquery.sap.mobile" ],
	function(jQuery, Device) {

	"use strict";

  // delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name : "thirdparty.chartjs",
		version: "1.0",
		dependencies : ["sap.m"],
		types: [
			"thirdparty.chartjs.ChartJsType"
    ],
    controls: [
			"thirdparty.chartjs.ChartJs",
			"thirdparty.chartjs.Dataset",
			"thirdparty.chartjs.Label"
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
