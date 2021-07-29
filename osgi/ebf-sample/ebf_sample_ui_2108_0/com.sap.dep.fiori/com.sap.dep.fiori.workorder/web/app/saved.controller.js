jQuery.sap.require("dep.fiori.lib.util.Utilities");

sap.ui.controller("dep.fiori.workorder.app.saved", {
    onInit: function() {
        this.router = sap.ui.core.UIComponent.getRouterFor(this);
        this.router.attachRoutePatternMatched(this.onRouteMatched, this);
    },

    onRouteMatched: function(oEvent) {
        if (oEvent.getParameter("name") === "saved") {
            var mSavedWorkorder = this.getOwnerComponent().getSavedWorkorder();
            if (mSavedWorkorder) {
                this.getView().setModel(mSavedWorkorder);

                this.mCreatedByImg = new sap.ui.model.json.JSONModel();
                this.getView().setModel(this.mCreatedByImg, "createdByImg");
                var self = this;
                dep.fiori.lib.util.Utilities.getUserImage().done(function(oResponseData) {
                    self.mCreatedByImg.setData(oResponseData);
                });
            } else {
                this.router.navTo("create", null, true);
            }
        }
    },

    formatters: {
        breakdown: function(MSAUS){
            return (MSAUS === "X");
        },

        breakdownText: function(MSAUS){
            var mi18nGlobal = this.getView().getModel("i18nGlobal").getResourceBundle();
            return (MSAUS === "X") ? mi18nGlobal.getText("General.yes") : mi18nGlobal.getText("General.no");
        }
    }
});