jQuery.sap.declare("dep.fiori.purchaseorder.Component");

sap.ui.core.UIComponent.extend("dep.fiori.purchaseorder.Component", {
    metadata: {
        manifest: "json",
        manifestFirst: true
    },

    createContent: function() {
        return sap.ui.view("dep-fiori-purchaseorder-main", {
            viewName: "dep.fiori.purchaseorder.app.main",
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