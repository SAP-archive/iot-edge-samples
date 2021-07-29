jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");

(function(ListControllerBase) {
    ListControllerBase.extend("dep.fiori.container.app.list", {
        onInit: function() {
            this.setKey("CONTAINER_ID");
            this.setODataServiceUrl("/dep/odata");
            this.setSortFragment("dep.fiori.container.app.listSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);
        },
        
        getFilterItems: function() {
            return [
                { key: "CONTAINER_ID", label: "{i18n>Container.id}" },
                { key: "CONTAINER_DESC", label: "{i18nGlobal>General.description}" },
                { key: "CONTAINER_TYPE", label: "{i18n>Container.type}" },
                { key: "EXT_CONTAINER_ID", label: "{i18n>Container.ext_id}" },
                { key: "CONTAINER_SOURCE", label: "{i18n>Container.source}" }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase));