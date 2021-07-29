jQuery.sap.declare("dep.fiori.assignment.Component");

sap.ui.core.UIComponent.extend("dep.fiori.assignment.Component", {
    metadata: {
        manifest: "json",
        manifestFirst: true
    },

    createContent: function() {
        return sap.ui.view("dep-fiori-assignment-main", {
            viewName: "dep.fiori.assignment.app.main",
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