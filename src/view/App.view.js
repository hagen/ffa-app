sap.ui.jsview("com.ffa.hpc.view.App", {

	getControllerName: function () {
		return "com.ffa.hpc.view.App";
	},

	createContent : function (oController) {
		// to avoid scroll bars on desktop the root view must be set to block display
		this.setDisplayBlock(true);
		oController._app = new sap.m.NavContainer({
			id : "idContainer"
		});
		return oController._app;
	}

});
