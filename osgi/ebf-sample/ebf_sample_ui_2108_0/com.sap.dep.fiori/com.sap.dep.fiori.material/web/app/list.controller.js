jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(ListControllerBase, Filter, Utilities) {
    ListControllerBase.extend("dep.fiori.material.app.list", {
        onInit: function() {
            this.setKey([ "WERKS", "MATNR", "LGORT" ]);
            this.setDetailRoute("display");
            this.setSortFragment("dep.fiori.material.app.materialSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);
            
            this.mMaterials = new sap.ui.model.json.JSONModel();
            
            this.mSearch = new sap.ui.model.json.JSONModel({ query: "", global: false });
            this.getView().setModel(this.mSearch, "search");
            
            this.oListItemTemplate = this.byId("listItemTemplate");
    
            var self = this;
            this.oLookupPromise = $.ajax("/ws_restful_data_controller/storage_location").done(function(oResponseData) {
                oResponseData = oResponseData || [];
                self.getView().setModel(new sap.ui.model.json.JSONModel(oResponseData), "locations");
            });
            
            this.mOData = this.getODataModel();
        },
        
        getFilterItems: function() {
            return [
                { key: "MATNR", label: "{i18nGlobal>MaterialSelect.material}" },
                { key: "MAKTX", label: "{i18nGlobal>General.description}" },
                { key: "LGORT", label: "{i18n>Material.storageLocation}", type: Filter.InputType.MultiSelect,
                  items: { path: "locations>/", key: "{locations>LGORT}", text: "{locations>LGORT}" } },
                { key: "LGPBE", label: "{i18n>Material.bin}" },
                { key: "NAME1", label: "{i18nGlobal>MaterialSelect.manufacturer}" },
                { key: "MFRPN", label: "{i18nGlobal>MaterialSelect.manufacturerPartNo}" },
                this.getEdgeErrorFilterItem()
            ];
        },
        
        onMaterialSearch: function(oEvent) {
            var oDeferred = $.Deferred();
            
            if (oEvent.getParameter("clearButtonPressed")) {
                this.mSearch.setProperty("/global", false);
                oDeferred.resolve(this.mOData, "/Material");
            } else {
                this.loadMaterials(this.mSearch.getProperty("/query"), this.mSearch.getProperty("/global")).done(function(aResponseData) {
                    this.mMaterials.setData(aResponseData);
                    oDeferred.resolve(this.mMaterials, "/");
                }.bind(this));
            }
            
            oDeferred.done(function(oModel, sPath) {
                this.getTable().unbindItems();
                this.getView().setModel(oModel, "odata");
                this.getTable().bindItems("odata>" + sPath, this.oListItemTemplate);
                this.onFilter();
            }.bind(this));
        },
        
        loadMaterials: function(sQuery, bGlobal) {
            var sEntity = bGlobal ? "global_materials" : "materials";
            var sURL = "/ws_restful_data_controller/" + sEntity + Utilities.getQueryString({ QUERY: sQuery });
            return Utilities.showBusyIndicator($.ajax(sURL));
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter, dep.fiori.lib.util.Utilities));