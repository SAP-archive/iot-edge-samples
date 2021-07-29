jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(ListControllerBase, Filter) {
    ListControllerBase.extend("dep.fiori.equipmentmodel.app.list", {
        onInit: function() {
            this.setKey("MODEL_ID");
            this.setODataServiceUrl("/dep/asset_core/odata");
            this.setSortFragment("dep.fiori.equipmentmodel.app.listSort");
            
            ListControllerBase.prototype.onInit.apply(this, arguments);
        },
        
        getFilterItems: function() {
            return [
                { key: "MODEL_NAME", label: "{i18n>Model.name}" },
                { key: "DESCRIPTION", label: "{i18nGlobal>General.description}" },
                { key: "MANUFACTURER", label: "{i18n>Model.manufacturer}" },
                { key: "CLASS", label: "{i18n>Model.class}" },
                { key: "SUBCLASS", label: "{i18n>Model.subClass}" },
                { key: "IS_ROOT_MODEL", label: "{i18n>Model.root}", type: Filter.InputType.Boolean,
                  compareValue: "1", filterOperator: sap.ui.model.FilterOperator.EQ },
                { key: "IS_SENSOR", label: "{i18n>Model.sensor}", type: Filter.InputType.Boolean,
                  compareValue: "1", filterOperator: sap.ui.model.FilterOperator.EQ }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter));