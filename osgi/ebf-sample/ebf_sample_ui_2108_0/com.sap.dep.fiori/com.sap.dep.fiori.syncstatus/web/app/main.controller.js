jQuery.sap.require("dep.fiori.lib.util.Utilities");

sap.ui.controller("dep.fiori.syncstatus.app.main", {
    onInit: function() {
        this.mInProgress = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.mInProgress, "inProgress");

        this.mErrors = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.mErrors, "errors");

        this.mFilterInProgress = new sap.ui.model.json.JSONModel({});
        this.getView().setModel(this.mFilterInProgress, "filterInProgress");
        
        this.mFilterErrors = new sap.ui.model.json.JSONModel({});
        this.getView().setModel(this.mFilterErrors, "filterErrors");

        dep.fiori.lib.util.Utilities.showBusyIndicator($.when(this.refreshInProgress(), this.refreshErrors()));

        this.oInProgressTable = this.getView().byId("inProgressTable");
        this.oErrorsTable = this.getView().byId("errorsTable");
    },

    refreshInProgress: function() {
        var self = this;
        return $.ajax("/ws_restful_data_controller/transaction_statuses").done(function(oResponseData) {
            self.mInProgress.setData(oResponseData);
        });
    },

    onRefreshInProgress: function() {
        var self = this;
        dep.fiori.lib.util.Utilities.showBusyIndicator(this.refreshInProgress()).done(function() {
            var oI18n = self.getView().getModel("i18n").getResourceBundle();
            sap.m.MessageToast.show(oI18n.getText("Toast.refresh"));
        });
    },

    refreshErrors: function() {
        var self = this;
        return $.ajax("/ws_restful_data_controller/transaction_errors").done(function(oResponseData) {
            self.mErrors.setData(oResponseData);
        });
    },

    onRefreshErrors: function() {
        var self = this;
        dep.fiori.lib.util.Utilities.showBusyIndicator(this.refreshErrors()).done(function() {
            var oI18n = self.getView().getModel("i18n").getResourceBundle();
            sap.m.MessageToast.show(oI18n.getText("Toast.refresh"));
        });
    },

    dateFormatter: function(sTransId) {
        var sDate = sTransId.substr(0, 4) + "-" + sTransId.substr(4, 2) + "-" + sTransId.substr(6, 2) + " " +
            sTransId.substr(8, 2) + ":" + sTransId.substr(10, 2) + ":" + sTransId.substr(12, 2);
        var oDate = new Date(sDate);
        this.oFormatter = this.oFormatter || sap.ui.core.format.DateFormat.getDateTimeInstance();
        return this.oFormatter.format(oDate);
    },

    onFilterInProgress: function(oEvent) {
        var oCriteria = this.mFilterInProgress.getData();
        var aFilters = [];

        if (oCriteria.hasOwnProperty("start") && oCriteria.start) {
            aFilters.push(
                new sap.ui.model.Filter(
                    "TRANSID",
                    sap.ui.model.FilterOperator.GE,
                    oCriteria.start
                )
            );
        }

        if (oCriteria.hasOwnProperty("end") && oCriteria.end) {
            aFilters.push(
                new sap.ui.model.Filter(
                    "TRANSID",
                    sap.ui.model.FilterOperator.LE,
                    oCriteria.end
                )
            );
        }

        var oFilter = new sap.ui.model.Filter({
            filters: aFilters,
            and: true
        });

        var oBinding = this.oInProgressTable.getBinding("items");
        oBinding.filter(oFilter);
    },

    onClearInProgressFilter: function(oEvent) {
        this.mFilterInProgress.setData({});
        this.onFilterInProgress(oEvent);
    },

    onFilterErrors: function(oEvent) {
        var oCriteria = this.mFilterErrors.getData();
        var aFilters = [];

        if (oCriteria.hasOwnProperty("start") && oCriteria.start) {
            aFilters.push(
                new sap.ui.model.Filter(
                    "TRANSID",
                    sap.ui.model.FilterOperator.GE,
                    oCriteria.start
                )
            );
        }

        if (oCriteria.hasOwnProperty("end") && oCriteria.end) {
            aFilters.push(
                new sap.ui.model.Filter(
                    "TRANSID",
                    sap.ui.model.FilterOperator.LE,
                    oCriteria.end
                )
            );
        }

        var oFilter = new sap.ui.model.Filter({
            filters: aFilters,
            and: true
        });

        var oBinding = this.oErrorsTable.getBinding("items");
        oBinding.filter(oFilter);
    },

    onClearErrorsFilter: function(oEvent) {
        this.mFilterErrors.setData({});
        this.onFilterErrors(oEvent);
    }
});