jQuery.sap.require("dep.fiori.lib.util.DataAccess");

sap.ui.controller("dep.fiori.workorderop.app.list", {

    onInit: function() {
        this.setRouter(sap.ui.core.UIComponent.getRouterFor(this));

        this.workorderList = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");

        this.getView().setModel(this.workorderList, "ODATA_MODEL");
        this.loadWorkOrderLength();
    },

    navToEditWorkOrder: function(oEvent){
        var sAUFNR = oEvent.getSource().getBindingContext("ODATA_MODEL").getObject().AUFNR;
        this.getRouter().navTo("detail", { AUFNR: sAUFNR });
    },

    getRouter: function() {
        return this.oRouter;
    },

    setRouter: function(oRouter) {
        this.oRouter = oRouter;
    },

    loadWorkOrderLength: function(){
        var self = this;
        jQuery.ajax("/dep/odata/Workorder/$count").done(function(oResponseData, errorText, errorThrown) {
            var i18n = self.getView().getModel("i18n");
            self.getView().byId("tableTitle").setText(i18n.getResourceBundle().getText("WOList.count", [oResponseData]));
        });
    },

    // when sorting button is pressed
    handleViewSettingsDialogButtonPressed: function (oEvent) {
        if (!this.dialog) {
            this.dialog = sap.ui.xmlfragment("dep.fiori.workorderop.app.sort", this);
            this.getView().addDependent(this.dialog);
        }
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.dialog);
        this.dialog.open();
    },

    // this is used for binding sorter to the list of table
    handleConfirm: function(oEvent) {
        var oBinding = this.getView().byId("enter-workorder-table").getBinding("items");
        var mParams = oEvent.getParameters();
        // setting sorters
        var aSorters = [];
        var sPath = mParams.sortItem.getKey();
        var bDescending = mParams.sortDescending;
        aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
        oBinding.sort(aSorters);
    },

    dateToIDATE : function(oDate){
        if (!oDate) {
            return null;
        }
        var month = oDate.getMonth();
        var date = oDate.getDate();
        var year = oDate.getYear();
        // this is a simple algorithm for getting "YYYYMMDD" format
        // ex: year is 117, then (year + 1900) is 2017, month is 0, then (month + 1)
        // is 1, meaning january,
        var fullDate = (year + 1900) * 10000 + (month + 1) * 100 + date;
        var sFullDate = fullDate.toString();
        return sFullDate;
    },

    onFilter: function(){
        var oBinding = this.getView().byId("enter-workorder-table").getBinding("items");

        var workorderNumber = this.getView().byId("workorderNumber").getValue();
        var description = this.getView().byId("description").getValue();
        var orderStatus = this.getView().byId("orderStatus").getValue();
        var equipment = this.getView().byId("equipment").getValue();
        var mainWorkCenter = this.getView().byId("mainWorkCenter").getValue();
        var orderDueDate = dep.fiori.lib.util.Utilities.date.toYYYYMMDD(this.getView().byId("orderDueDate").getDateValue());

        var workorderNumberFilter = new sap.ui.model.Filter("AUFNR","Contains", workorderNumber || "");
        var descriptionFilter = new sap.ui.model.Filter("KTEXT","Contains", description || "");
        var orderStatusFilter = new sap.ui.model.Filter("USER_STATUS","Contains", orderStatus || "");
        var equipmentFilter = new sap.ui.model.Filter("EQUNR","Contains", equipment || "");
        var mainWorkCenterFilter = new sap.ui.model.Filter("VAPLZ","Contains", mainWorkCenter || "");
        var orderDueDateFilter = new sap.ui.model.Filter("GLTRP","Contains", orderDueDate || "");

        var allFilter = new sap.ui.model.Filter([ workorderNumberFilter,descriptionFilter,orderStatusFilter,equipmentFilter,mainWorkCenterFilter,orderDueDateFilter],true); 
        oBinding.filter(allFilter);
    },

    onClear : function(){
        var oBinding = this.getView().byId("enter-workorder-table").getBinding("items");
        oBinding.aFilters = null;
        this.byId("orderDueDate").setDateValue();
        this.byId("description").setValue();
        this.byId("workorderNumber").setValue();
    },

    onCreateWorkorder: function() {
        var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
        oNavigationService.toExternal({
            target: {
                shellHash: "#depWorkorder-create"
            }
        });
    }
});