jQuery.sap.declare("util.DateFormatter");
jQuery.sap.require("thirdparty.momentjs.Momentjs");

util.DateFormatter = {
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
	}
};
