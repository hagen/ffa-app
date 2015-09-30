jQuery.sap.declare("com.ffa.hpc.util.DateFormatter");
jQuery.sap.require("com.ffa.hpc.thirdparty.momentjs.Momentjs");

com.ffa.hpc.util.DateFormatter = {
	/**
	 * A variable date type variable comes in, and we are to convert it to a
	 * dd/MM/yyyy format string.
	 * @param  {Date|string|int} vDate The date to convert
	 * @return {string} The resulting format date string
	 */
	ddMMyyyy : function(vDate) {
		// Don't bother if there's nothing there
		if(vDate === "" || vDate === null) {
			vDate = new Date(Date.now());
		}

		// If pattern wasn't supplied, use default
		var sPattern = "dd/MM/yyyy";

		// Need SAP formatter
		jQuery.sap.require("sap.ui.core.format.DateFormat");

		// Gateway Date and Time Values
		var dDate = new Date(vDate);

		// Create the Date Formatter
		var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
			pattern : sPattern
		});
		return dateFormat.format(new Date(dDate.getTime()));
	},

	/**
	 * Converts the supplied milliseconds to a meaningful duration of time
	 * @param  {String}	Duration milliseconds (UI5 formatter functions get everything as a string)
	 * @return {string} The duration, as a humanised string
	 */
	years : function(sDur) {
		var i = parseInt(sDur, 10);
		var a = moment();
		var b = moment(a);
		b.add(i, "ms");
		return a.diff(b, "years", true); // 1.5
	},

	/**
	 * Add one day to the supplied date
	 * @param  {Date}	The begin date
	 * @return {string} The next day, as a humanised string
	 */
	add1Day : function(dDate) {
		var a = moment(dDate);
		a.add(1, "days");
		return a.format("DD/MM/YYYY");
	},

	/**
	 * Nice date formatter. Provide the date, and the format, and away you go.
	 * @param oDate date object
	 * @param ?sPattern Optional pattern - defaul is dd/MM/yyyy
	 */
	formatDate : function(oDate) {
		return util.DateFormatter.formatDatePattern(oDate, "dd/MM/yyyy");
	},

	/**
	 * Nice date formatter. Provide the date, and the format, and away you go.
	 * @param sDate string date
	 * @param ?sPattern Optional pattern - defaul is dd/MM/yyyy
	 */
	formatDatePattern : function(sDate, sPattern) {
		// Don't bother if there's nothing there
		if(sDate === "" || sDate === null)
			return "";

		// If pattern wasn't supplied, use default
		if(!sPattern) {
			sPattern = "dd/MM/yyyy";
		}

		// Need SAP formatter
		jQuery.sap.require("sap.ui.core.format.DateFormat");

		// Gateway Date and Time Values
		var dDate = new Date(sDate);

		// Create the Date Formatter
		var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
			pattern : sPattern
		});

		return dateFormat.format(new Date(dDate.getTime()));
	},
};
