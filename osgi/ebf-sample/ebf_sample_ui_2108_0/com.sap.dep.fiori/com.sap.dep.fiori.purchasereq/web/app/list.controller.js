jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(ListControllerBase, Filter) {
    ListControllerBase.extend("dep.fiori.purchasereq.app.list", {
        onInit: function() {
            this.setKey("PR_NO_LOCAL");
            this.setSortFragment("dep.fiori.purchasereq.app.prSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);
            
            this.getView().setModel(new sap.ui.model.json.JSONModel([
                { key: "M", text: this.getText("POTYP.M") },
                { key: "S", text: this.getText("POTYP.S") }
            ]), "prTypes");
            
            this.getView().setModel(new sap.ui.model.json.JSONModel([
                { key: "PR_PENDING", text: this.getText("PRStatus.PR_PENDING") },
                { key: "PR_WAITING", text: this.getText("PRStatus.PR_WAITING") },
                { key: "PR_APPROVED", text: this.getText("PRStatus.PR_APPROVED") },
                { key: "PR_REJECTED", text: this.getText("PRStatus.PR_REJECTED") }
            ]), "statuses");
        },

        typeFormatter: function(sPOTYP) {
            return this.getText("POTYP." + sPOTYP);
        },

        statusFormatter: function(sStatus) {
            return this.getText("PRStatus." + sStatus);
        },
        
        getFilterItems: function() {
            return [
                { key: "BANFN", label: "{i18n>PR.number}" },
                { key: "PR_NO_LOCAL", label: "{i18n>PR.localNumber}" },
                { key: "POTYP", label: "{i18n>PR.type}", type: Filter.InputType.MultiSelect,
                  items: { path: "prTypes>/", key: "{prTypes>key}", text: "{prTypes>text}" } },
                { key: "PR_STATUS", label: "{i18n>PR.status}", type: Filter.InputType.MultiSelect,
                  items: { path: "statuses>/", key: "{statuses>key}", text: "{statuses>text}" } },
                { key: "LTXT", label: "{i18nGlobal>General.description}" },
                this.getEdgeErrorFilterItem()
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter));