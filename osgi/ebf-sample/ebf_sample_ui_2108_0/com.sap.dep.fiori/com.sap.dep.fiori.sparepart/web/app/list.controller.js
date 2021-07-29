jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");

(function(ListControllerBase) {
    ListControllerBase.extend("dep.fiori.sparepart.app.list", {
        onInit: function() {
            this.setKey("PART_ID");
            this.setODataServiceUrl("/dep/asset_core/odata");
            this.setSortFragment("dep.fiori.sparepart.app.listSort");
            
            ListControllerBase.prototype.onInit.apply(this, arguments);
        },
        
        getFilterItems: function() {
            return [
                { key: "INTERNAL_ID", label: "{i18n>Part.internalId}" },
                { key: "DESCRIPTION", label: "{i18nGlobal>General.description}" },
                { key: "SUBCLASS", label: "{i18n>Part.subclass}" },
                { key: "SOURCE", label: "{i18n>Part.source}" },
                { key: "MANUFACTURER", label: "{i18n>Part.manufacturer}" },
                { key: "MFR_PART_NUMBER", label: "{i18n>Part.mfrPartNumber}" },
                { key: "EAN_NUMBER", label: "{i18n>Part.eanNumber}" },
                { key: "UOM", label: "{i18n>Part.uom}" }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase));