jQuery.sap.declare("dep.fiori.syncstatus.Component");

sap.ui.core.UIComponent.extend("dep.fiori.syncstatus.Component", {
    metadata: {
        manifest: "json",
        manifestFirst: true
    },

    createContent: function() {
        return sap.ui.view("dep-fiori-syncstatus-main", {
            viewName: "dep.fiori.syncstatus.app.main",
            type: sap.ui.core.mvc.ViewType.XML,
            viewData: {
                component: this
            }
        });
    },

    init: function() {
        sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
        this.getRouter().initialize();
    }
});