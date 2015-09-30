sap.ui.define(["jquery.sap.global", "sap/ui/Device", "sap/ui/core/library", "jquery.sap.mobile" ],
	function(jQuery, Device) {

	"use strict";

  // delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name : "com.ffa.hpc.thirdparty.chartjs",
		version: "1.0",
		dependencies : ["sap.m"],
		types: [
			"com.ffa.hpc.thirdparty.chartjs.ChartJsType"
    ],
    controls: [
			"com.ffa.hpc.thirdparty.chartjs.ChartJs",
			"com.ffa.hpc.thirdparty.chartjs.Dataset",
			"com.ffa.hpc.thirdparty.chartjs.Label"
    ]
  });

	/**
	 * Types of the Chart
	 */
	com.ffa.hpc.thirdparty.chartjs.ChartJsType = {
		Line : "Line"
	};

	return com.ffa.hpc.thirdparty.chartjs;

});
