jQuery.sap.declare("dep.fiori.syncservices.Component");

sap.ui.core.UIComponent.extend("dep.fiori.syncservices.Component", {
    metadata: {
        manifest: "json",
        manifestFirst: true
    },

    createContent: function() {
        return sap.ui.view("dep-fiori-syncservices-main", {
            viewName: "dep.fiori.syncservices.app.main",
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