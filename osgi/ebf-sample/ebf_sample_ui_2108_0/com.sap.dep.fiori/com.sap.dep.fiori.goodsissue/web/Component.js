jQuery.sap.declare("dep.fiori.goodsissue.Component");

sap.ui.core.UIComponent.extend("dep.fiori.goodsissue.Component", {
    metadata: {
        manifest: "json",
        manifestFirst: true
    },

    createContent: function() {
        return sap.ui.view("dep-fiori-goodsissue-main", {
            viewName: "dep.fiori.goodsissue.app.main",
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