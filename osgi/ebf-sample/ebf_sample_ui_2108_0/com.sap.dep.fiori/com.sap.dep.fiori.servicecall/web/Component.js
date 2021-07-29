jQuery.sap.declare("dep.fiori.servicecall.Component");

sap.ui.core.UIComponent.extend("dep.fiori.servicecall.Component", {
    metadata: {
        manifest: "json",
        manifestFirst: true
    },

    createContent: function() {
        return sap.ui.view("dep-fiori-servicecall-main", {
            viewName: "dep.fiori.servicecall.app.main",
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