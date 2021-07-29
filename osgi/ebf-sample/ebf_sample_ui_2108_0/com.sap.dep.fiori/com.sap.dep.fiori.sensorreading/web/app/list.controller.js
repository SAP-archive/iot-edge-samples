jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(ListControllerBase, Utilities, Filter) {
    ListControllerBase.extend("dep.fiori.sensorreading.app.list", {
        onInit: function() {
            this.setKey("PART_ID");
            this.setODataServiceUrl("/dep/asset_core/odata");
            this.setSortFragment("dep.fiori.sensorreading.app.listSort");

            this.mSensors = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mSensors);

            this.mMappingType = new sap.ui.model.json.JSONModel("/ws_restful_data_controller/sensor_mapping_types");
            this.getView().setModel(this.mMappingType, "mappingType");

            ListControllerBase.prototype.onInit.apply(this, arguments);
        },

        onRouteMatched: function(oEvent) {
            if (oEvent.getParameter("name") === "list") {
                this.onRefresh(oEvent);
            }
        },

        onRefresh: function(oEvent) {
            var self = this;
            this.mSensors.setData([]);
            Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/sensor_mapping").done(function(aResponseData) {
                self.mSensors.setData(aResponseData);
            }));
        },

        getFilterItems: function() {
            return [
                { key: "SOURCE", label: "{i18n>General.source}" },
                { key: "SENSOR", label: "{i18n>General.sensor}" },
                { key: "MAPPING_TYPE", label: "{i18n>General.mappingType}", type: Filter.InputType.MultiSelect,
                  items: { path: "mappingType>/", key: "{locations>MAPPING_TYPE}", text: "{locations>MAPPING_TYPE}" } },
                { key: "MAPPING_ID", label: "{i18nGlobal>General.mappingId}" }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.Filter));