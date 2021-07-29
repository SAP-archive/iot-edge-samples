jQuery.sap.declare("dep.fiori.sensorreading.Component");

sap.ui.core.UIComponent.extend("dep.fiori.sensorreading.Component", {
    metadata: {
        manifest: "json",
        manifestFirst: true
    },

    createContent: function() {
        return sap.ui.view("dep-fiori-sensorreading-main", {
            viewName: "dep.fiori.sensorreading.app.main",
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