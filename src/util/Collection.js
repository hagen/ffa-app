jQuery.sap.declare("util.Collection");

util.Collection = {

	/**
	 * Return collection count
	 * @param  {[type]} aItems [description]
	 * @return {[type]}        [description]
	 */
	count : function(aItems) {
		return (aItems ? aItems.length : 0);
	},
};
