jQuery.sap.require("dep.fiori.lib.util.DataAccess");

sap.ui.controller("dep.fiori.workorderop.app.detail", {

    onInit: function() {
        this.setRouter(sap.ui.core.UIComponent.getRouterFor(this));
        this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
    },

    onRouteMatched: function(oEvent) {
        if (oEvent.getParameter("name") === "detail") {
            var aufnr = oEvent.getParameters().arguments.AUFNR;
            if (aufnr) {
                if (this.dirtyFlag) {
                    sap.ushell.Container.setDirtyFlag(true);
                }
                this.loadWorkorder(aufnr);
            }
        } else if (oEvent.getParameter("name") === "create") {// do nothing
        } else {
            this.odataModel = null;
            this.workorderDetails = null;
            this.workorderOperations = null;
            this.selectedOperation = null;
            this.dirtyFlag = false;
        }
    },

    handleTableSelectDialogPress: function(oEvent) {
        sap.ushell.Container.setDirtyFlag(false);
        var oContext = oEvent.getSource().getBindingContext();
        var oOperation = oContext.getModel().getProperty(oContext.getPath());
        this.selectedOperation.setData($.extend({}, oOperation));
        this.getRouter().navTo("operation", { AUFNR: oOperation.AUFNR, VORNR: oOperation.VORNR });
    },

    getRouter: function() {
        return this.oRouter;
    },

    setRouter: function(oRouter) {
        this.oRouter = oRouter;
    },

    navToCreateOperation: function(oEvent){
        sap.ushell.Container.setDirtyFlag(false);
        this.getRouter().navTo("create", { AUFNR: this.aufnr });
    },

    changeState: function(oEvent){
        sap.ushell.Container.setDirtyFlag(true);
        this.dirtyFlag = true;
    },

    loadWorkorder: function(aufnr){
        this.aufnr = aufnr; //global aufnr for other functions to use
        if (this.selectedOperation) {
            this.selectedOperation.setData();
        }
        if (!this.odataModel) { //this acts like onInit
            this.dirtyFlag = false;
            this.odataModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");
            this.odataModel.setDeferredGroups(["saveOperations"]);

            this.i18n = this.getView().getModel("i18n");
            this.i18nGlobal = this.getView().getModel("i18nGlobal");

            this.getView().setModel(this.odataModel, "odata");

            //this model is for workorder Edit to use for populating data for edit
            this.selectedOperation = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.selectedOperation, "SELECTED_OPERATION");

            this.comboBoxModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.comboBoxModel, "COMBO_BOX_MODEL");
            this.comboBoxModel.setData({Control_Key_List: [], Workcenter: []});

            this.workorderDetails = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.workorderDetails, "workorder");

            this.workorderOperations = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.workorderOperations);
            this.workorderOperations.attachPropertyChange(this.changeState, this);

            this.mAllowOperationDelete = new sap.ui.model.json.JSONModel();
            this.mAllowOperationDelete.setData("N");
            this.getView().setModel(this.mAllowOperationDelete, "allowDelete");

            var self = this;
            var oWorkorderPromise = $.Deferred();

            this.odataModel.read("/Control_Key_List", {
                context: null,
                success: function(oResponseData, response){
                    self.comboBoxModel.setProperty("/Control_Key_List", oResponseData.results);
                },
                error: function(oResponseData, response){

                }
            });

            this.odataModel.read("/Workcenter", {
                context: null,
                success: function(oResponseData, response){
                    self.comboBoxModel.setProperty("/Workcenter", oResponseData.results);
                },
                error: function(oResponseData, response){

                }
            });


            this.odataModel.read("/Workorder('" + aufnr + "')", {
                context: null,
                success: function(oResponseData, response){
                    self.workorderDetails.setData(oResponseData);
                    oWorkorderPromise.resolve(oResponseData);
                },
                error: function(oResponseData, response){

                }
            });

            this.aufnrFilter = [new sap.ui.model.Filter({
                path: "AUFNR",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : aufnr
            })];

            var oOperationsPromise = $.Deferred();
            this.odataModel.read("/Workorder_Operations", {
                context: null,
                success: function(oResponseData, response){
                    self.workorderOperations.setData(oResponseData.results);
                    oOperationsPromise.resolve(oResponseData);
                },
                error: function(oResponseData, response){

                },
                filters: this.aufnrFilter
            });


            $.ajax("/saapconfig/WOAllowOperationDelete").done(function(sAllowDelete) {
                self.mAllowOperationDelete.setData(sAllowDelete);
            }).fail(function() {
                self.mAllowOperationDelete.setData("Y");
            });

            $.when(oWorkorderPromise, oOperationsPromise).done(function() {
                self.getView().byId("operationAddButton").setEnabled(true);
            });
        }
    },

    saveOperations: function(){
        var self = this;
        this.getView().byId("save-button").setEnabled(false);
        for (var x = 0; x < this.workorderOperations.getData().length; x ++) {
            if (this.workorderOperations.getData()[x].VORNR.indexOf("P") > -1) {
                this.odataModel.create("/WORKORDER_OPERATIONS", [this.workorderOperations.getData()[x]], {
                    success: function(oResponseData){
                    },
                    error: function(oResponseData){
                        if (oResponseData.statusCode.toString() !== "200") {
                            sap.m.MessageToast.show(JSON.parse(oResponseData.responseText).error.message);
                        }
                        self.errorSubmitting = true;
                    },
                    groupId: "saveOperations"
                });

            } else {
                this.odataModel.update("/WORKORDER_OPERATIONS", this.workorderOperations.getData()[x], {
                    success: function(oResponseData){
                    },
                    error: function(oResponseData){
                        if (oResponseData.statusCode.toString() !== "200") {
                            sap.m.MessageToast.show(JSON.parse(oResponseData.responseText).error.message);
                        }
                        self.errorSubmitting = true;
                    },
                    groupId: "saveOperations"
                });
            }
        }

        //sends batch with all operations and then reloads the list
        this.errorSubmitting = false;
        this.odataModel.submitChanges({batchGroupId: "saveOperations",
            success: function(oResponseData){
                self.getView().byId("save-button").setEnabled(true);
                if (!self.errorSubmitting) {
                    sap.m.MessageToast.show(self.i18n.getProperty("Success.MSG1") + " " + self.aufnr + " " + self.i18n.getProperty("Success.MSG2"));
                }
                self.odataModel.read("/Workorder_Operations", {
                    context: null,
                    success: function(oRespData, response){
                        self.workorderOperations.setData(oRespData.results);
                        sap.ushell.Container.setDirtyFlag(false);
                        this.dirtyFlag = false;
                    },
                    error: function(oRespData, response){

                    },
                    filters: self.aufnrFilter
                });
            },
            error: function(oResponseData){
                self.getView().byId("save-button").setEnabled(true);
                sap.m.MessageToast.show(self.i18n.getProperty("Error.ERR1"));
                self.odataModel.read("/Workorder_Operations", {
                    context: null,
                    success: function(oRespData, response){
                        self.workorderOperations.setData(oRespData.results);
                        sap.ushell.Container.setDirtyFlag(false);
                        this.dirtyFlag = false;
                    },
                    error: function(oRespData, response){

                    },
                    filters: self.aufnrFilter
                });
            }
        });
    },

    onExit: function(){

    },

    cancel: function(){
        this.getRouter().navTo("list");
    },

    removeOperation: function(oEvent){
        var self = this;
        sap.ushell.Container.setDirtyFlag(true);
        this.dirtyFlag = true;
        var vornr = oEvent.getParameter("listItem").getBindingContext().getObject().VORNR;
        for (var x = 0; x < this.workorderOperations.getData().length; x ++) {
            if (this.workorderOperations.getData()[x].VORNR === vornr) {
                this.workorderOperations.getData().splice(x, 1);
                this.workorderOperations.setProperty("/", this.workorderOperations.getData());
                if (vornr.indexOf("P") <= -1) {
                    this.odataModel.remove("/Workorder_Operations(AUFNR='" + this.aufnr + "',VORNR='" + vornr + "')", {
                        success: function(oResponseData){
                        },
                        error: function(oResponseData){
                            if (oResponseData.statusCode.toString() !== "200") {
                                sap.m.MessageToast.show(JSON.parse(oResponseData.responseText).error.message);
                            }
                            self.errorSubmitting = true;
                        },
                        groupId: "saveOperations"
                    });
                }
            }
        }
        this.workorderOperations.refresh(true);
    },

    formatters: {
        listTitle: function(itemCount) {
            var mI18n = this.getView().getModel("i18n");
            if (mI18n) {
                return mI18n.getResourceBundle().getText("List.count", [itemCount]);
            }
            return null;
        },

        pendingVornr: function(vornr){
            if (vornr.indexOf("P") > -1) {
                var mI18n = this.getView().getModel("i18n");
                if (mI18n) {
                    return mI18n.getResourceBundle().getText("VORNR.pending");
                }
            }
            return vornr;
        }
    }
});