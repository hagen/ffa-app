jQuery.sap.declare("com.ffa.hpc.util.FloatFormatter");

com.ffa.hpc.util.FloatFormatter = {
	formatMAPEPercent : function(fMape) {
		if(fMape) {
			try {
				return parseFloat(fMape).toFixed(2) + "%";
			} catch (ex) {
				return "-";
			}
		} else {
			return "Not run";
		}
	},
	/**
	 * Format float to specified number of decimal places
	 */
	parseFloat : function(sValue, iScale){

		if(!sValue) {
			return;
		}

		if(!iScale) {
			iScale = 2;
		}

		// Need SAP formatter
		jQuery.sap.require("sap.ui.core.format.NumberFormat");

		// Create the Date Formatter
		var floatFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
			minFractionDigits : 0,
			maxFractionDigits : iScale
		});

		return floatFormat.parse(sValue);
	}
};
