function ShortId() {
	this.alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	this.length = 8;
};
/**
 * Generate a short ID using predefined alphabet and length (static method)
 */
ShortId.generate = function(length) {
	var oShortId = new ShortId();
	if(length === 0 || length == 'undefined') {
		length = this.length;
	}
	var rtn = "";
  for (var i = 0; i < length; i++) {
  	rtn += oShortId.alphabet.charAt(Math.floor(Math.random() * oShortId.alphabet.length));
  }
  return rtn;
};
