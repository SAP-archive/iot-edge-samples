jQuery.sap.declare("dep.fiori.workorder.Component");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");

sap.ui.core.UIComponent.extend("dep.fiori.workorder.Component", {
    metadata: {
        manifest: "json",
        manifestFirst: true
    },

    createContent: function() {
        return sap.ui.view("dep-fiori-workorder-main", {
            viewName: "dep.fiori.workorder.app.main",
            type: sap.ui.core.mvc.ViewType.XML,
            viewData: {
                component: this
            }
        });
    },

    init: function() {
        sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
        this.getRouter().initialize();
    },

    setSavedWorkorder: function(mWorkorder) {
        this._oSavedWorkorder = mWorkorder;
    },

    getSavedWorkorder: function() {
        return this._oSavedWorkorder;
    }
});