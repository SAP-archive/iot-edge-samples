jQuery.sap.require("dep.fiori.assignment.app.Constants");
jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.SelectGenericDialog");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(Constants, CreateControllerBase, SelectGenericDialog, Utilities) {
    CreateControllerBase.extend("dep.fiori.assignment.app.create", {
        
        onTypeChange: function(oEvent) {
            this.getObjectModel().setProperty("/OBJKEY", "");
            this.getObjectModel().setProperty("/OBJSUBKEY", "");
        },

        onObjectKeyValueHelp: function(oEvent) {
            var oInput = oEvent.getSource();
            var sEntity = "";
            var sKeyField = "";
            var aColumns = [];
            var sObjectType = this.getObjectModel().getProperty("/OBJTYPE");
            
            switch (sObjectType) {
                case Constants.AssignmentType.WORKORDER:
                case Constants.AssignmentType.OPERATION:
                    sEntity = "/Workorder";
                    sKeyField = "AUFNR";
                    aColumns = [
                        { sHeader: Utilities.geti18nGlobal("General.workorder"), sField: "AUFNR" },
                        { sHeader: Utilities.geti18nGlobal("General.description"), sField: "KTEXT" },
                        { sHeader: Utilities.geti18nGlobal("General.workCenter"), sField: "VAPLZ" },
                        { sHeader: Utilities.geti18nGlobal("Workorder.userStatus"), sField: "USER_STATUS" }
                    ];
                    break;
                case Constants.AssignmentType.PHYS_INV_DOC:
                    sEntity = "/Physical_Inventory_Documents";
                    sKeyField = "INV_NO_LOCAL";
                    aColumns = [
                        { sHeader: Utilities.geti18nGlobal("General.piDoc"), sField: "INV_NO_LOCAL" },
                        { sHeader: Utilities.geti18nGlobal("General.location"), sField: "LGORT" },
                        { sHeader: Utilities.geti18nGlobal("PIDoc.totalItems"), sField: "TOTAL_ITEMS" },
                        { sHeader: Utilities.geti18nGlobal("PIDoc.uncountedItems"), sField: "ITEMS_UNCOUNTED" }
                    ];
                    break;
                default:
                    break;
            }
            
            var self = this;
            SelectGenericDialog.getEntity({
                sEntityPath: sEntity,
                aColumns: aColumns
            }).done(function(oObject) {
                oInput.setValue(oObject[sKeyField]);
                self.getObjectModel().setProperty("/OBJSUBKEY", "");
                self.loadSubObjects(sObjectType, oObject[sKeyField]);
            });
        },
        
        loadSubObjects: function(sObjectType, sObjectKey) {
            switch (sObjectType) {
                case Constants.AssignmentType.OPERATION:
                    this.loadOperations(sObjectKey);
                    break;
                default:
                    break;
            }
        },
        
        loadOperations: function(sAUFNR) {
            var sURL = "/ws_restful_data_controller/workorder_operations?AUFNR=" + sAUFNR;
            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(oResponseData) {
                self.aOperations = oResponseData;
            }));
        },
        
        onObjectSubKeyValueHelp: function(oEvent) {
            var oInput = oEvent.getSource();
            var vEntity = "";
            var sKeyField = "";
            var aColumns = [];
            var sObjectType = this.getObjectModel().getProperty("/OBJTYPE");
            
            switch (sObjectType) {
                case Constants.AssignmentType.OPERATION:
                    vEntity = this.aOperations;
                    sKeyField = "VORNR";
                    aColumns = [
                        { sHeader: Utilities.geti18nGlobal("General.operation"), sField: "VORNR" },
                        { sHeader: Utilities.geti18nGlobal("General.description"), sField: "LTXA1" },
                        { sHeader: Utilities.geti18nGlobal("General.workCenter"), sField: "ARBPL" },
                        { sHeader: Utilities.geti18nGlobal("Operation.controlKey"), sField: "STEUS" }
                    ];
                    break;
                default:
                    break;
            }
            
            SelectGenericDialog.getEntity({
                sEntityPath: vEntity,
                aColumns: aColumns
            }).done(function(oObject) {
                oInput.setValue(oObject[sKeyField]);
            });
        },
        
        onUserValueHelp: function(oEvent) {
            var oInput = oEvent.getSource();
            SelectGenericDialog.getEntity({
                sEntityPath: "/Local_User",
                aColumns: aColumns = [
                    { sHeader: Utilities.geti18nGlobal("General.user"), sField: "PLANTUSER" },
                    { sHeader: Utilities.geti18nGlobal("General.workCenter"), sField: "WORK_CENTER" }
                ]
            }).done(function(oObject) {
                oInput.setValue(oObject.PLANTUSER);
            });
        },

        onSave: function(oEvent) {
            var bValid = this.validateRequiredFields();
            if (bValid) {
                var oRequestData = Object.assign({
                    OBJTYPE: "",
                    OBJKEY: "",
                    OBJSUBKEY: "",
                    PLANTUSER: "",
                    STATUS: Constants.AssignmentStatus.ASSIGNED
                }, this.getObjectModel().getData());
    
                var self = this;
                Utilities.showBusyIndicator($.ajax({
                    url: "/ws_restful_data_controller/task_assignment",
                    method: "POST",
                    data: JSON.stringify([ oRequestData ])
                }).done(function(oResponseData) {
                    if (Array.isArray(oResponseData)) {
                        oResponseData = oResponseData[0];
                    }
    
                    if (oResponseData.ErrorID) {
                        sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.requestError", [ oResponseData.ErrorMsg ]));
                    } else {
                        sap.m.MessageToast.show(self.getText("ToastMessage.createSuccess"), {
                            closeOnBrowserNavigation: false
                        });
                        self.getObjectModel().setData({
                            OBJTYPE: self.byId("typeSelect").getSelectedKey()
                        });
                        self.getRouter().navTo("display");
                    }
                }).fail(function() {
                    sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
                }));
            }
        },
        
        onCancel: function(oEvent) {
            CreateControllerBase.prototype.onCancel.apply(this, arguments);
            this.getObjectModel().setData({
                OBJTYPE: this.byId("typeSelect").getSelectedKey()
            });
        },
        
        objKeyLabelFormatter: function(sObjType) {
            var sText;
            switch (sObjType) {
                case Constants.AssignmentType.WORKORDER:
                case Constants.AssignmentType.OPERATION:
                    sText = Utilities.geti18nGlobal("General.workorder");
                    break;
                case Constants.AssignmentType.PHYS_INV_DOC:
                    sText = Utilities.geti18nGlobal("General.piDoc");
                    break;
                default:
                    sText = "";
                    break;
            }
            return sText;
        },
        
        objSubKeyLabelFormatter: function(sObjType) {
            var sText;
            switch (sObjType) {
                case Constants.AssignmentType.OPERATION:
                    sText = Utilities.geti18nGlobal("General.operation");
                    break;
                default:
                    sText = "";
                    break;
            }
            return sText;
        }
    });
}(dep.fiori.assignment.app.Constants, dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.SelectGenericDialog, dep.fiori.lib.util.Utilities));