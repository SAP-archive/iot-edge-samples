jQuery.sap.declare("dep.fiori.sparepart.Component");

sap.ui.core.UIComponent.extend("dep.fiori.sparepart.Component", {
    metadata: {
        manifest: "json",
        manifestFirst: true
    },

    createContent: function() {
        return sap.ui.view("dep-fiori-sparepart-main", {
            viewName: "dep.fiori.sparepart.app.main",
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