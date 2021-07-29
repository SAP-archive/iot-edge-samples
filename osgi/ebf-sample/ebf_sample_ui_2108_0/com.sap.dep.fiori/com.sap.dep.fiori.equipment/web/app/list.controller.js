jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(ListControllerBase, Filter) {
    ListControllerBase.extend("dep.fiori.equipment.app.list", {
        onInit: function() {
            this.setKey("EQUNR");
            this.setSortFragment("dep.fiori.equipment.app.listSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);
        },
        
        getFilterItems: function() {
            return [
                { key: "EQUNR", label: "{i18nGlobal>EquipmentSelect.equipment}" },
                { key: "EQKTX", label: "{i18nGlobal>General.description}" },
                { key: "TPLNR", label: "{i18nGlobal>General.location}" },
                { key: "PLTXT", label: "{i18nGlobal>EquipmentSelect.locationDesc}" },
                { key: "KOSTL", label: "{i18n>Equipment.costCenter}" },
                { key: "IS_ROOT_EQUIP", label: "{i18n>Equipment.root}", type: Filter.InputType.Boolean,
                  compareValue: "1", filterOperator: sap.ui.model.FilterOperator.EQ }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter));