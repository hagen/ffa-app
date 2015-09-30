jQuery.sap.declare("com.ffa.hpc.util.Collection");

com.ffa.hpc.util.Collection = {

	/**
	 * Return collection count
	 * @param  {[type]} aItems [description]
	 * @return {[type]}        [description]
	 */
	count : function(aItems) {
		return (aItems ? aItems.length : 0);
	},
};
