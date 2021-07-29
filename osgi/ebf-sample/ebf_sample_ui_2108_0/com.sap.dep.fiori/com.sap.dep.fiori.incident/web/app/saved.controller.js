sap.ui.controller("dep.fiori.incident.app.saved", {
    onInit: function() {
        this.router = sap.ui.core.UIComponent.getRouterFor(this);
        this.router.attachRoutePatternMatched(this.onRouteMatched, this);
    },

    onRouteMatched: function(oEvent) {
        if (oEvent.getParameter("name") === "saved") {
            var mSavedIncident = this.getOwnerComponent().getSavedIncident();
            if (mSavedIncident) {
                this.getView().setModel(mSavedIncident);
                
                this.mCreatedByImg = new sap.ui.model.json.JSONModel();
                this.getView().setModel(this.mCreatedByImg, "createdByImg");
                var self = this;
                dep.fiori.lib.util.Utilities.getUserImage(mSavedIncident.getProperty("/USER_ID_CR")).done(function(oResponseData) {
                    self.mCreatedByImg.setData(oResponseData);
                });
            } else {
                this.router.navTo("create", null, true);
            }
        }
    }
});