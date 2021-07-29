jQuery.sap.declare("dep.fiori.incident.Component");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

sap.ui.core.UIComponent.extend("dep.fiori.incident.Component", {
    metadata: {
        manifest: "json",
        manifestFirst: true
    },

    createContent: function() {
        return sap.ui.view("dep-fiori-incident-main", {
            viewName: "dep.fiori.incident.app.main",
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

    setSavedIncident: function(mIncident) {
        this._oSavedIncident = mIncident;
    },

    getSavedIncident: function() {
        return this._oSavedIncident;
    }
});