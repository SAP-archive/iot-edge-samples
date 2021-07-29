jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.SelectGenericDialog");
jQuery.sap.require("dep.fiori.lib.util.SelectEquipmentDialog");

(function(CreateControllerBase, Utilities, SelectGenericDialog, SelectEquipmentDialog) {
    CreateControllerBase.extend("dep.fiori.servicecall.app.create", {
        onInit: function() {
            CreateControllerBase.prototype.onInit.apply(this, arguments);
            this.mServiceCall = this.getObjectModel();
    
            this.mStatus = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mStatus, "statuses");
    
            this.mPriority = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mPriority, "priorities");
            
            this.mProblemType = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mProblemType, "problemTypes");
            
            this.mOrigin = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mOrigin, "origin");
            
            this.getObjectModel().setData({responsibles: [], equipments: [], address: {}});

            this.loadStatus();
            this.loadPriority();
            this.loadProblemType();
            this.loadOrigin();
        },

        loadStatus: function() {
            this.mStatus.setData([]);
            var sURL = "/ws_restful_fsm_controller/service_call_status";
            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(aResponseData) {
                self.mStatus.setData(aResponseData);
            }));
        },

        loadPriority: function() {
            this.mPriority.setData([]);
            var sURL = "/ws_restful_fsm_controller/service_call_priority";
            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(aResponseData) {
                self.mPriority.setData(aResponseData);
            }));
        },

        loadProblemType: function() {
            this.mProblemType.setData([]);
            var sURL = "/ws_restful_fsm_controller/service_call_problem_type";
            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(aResponseData) {
                self.mProblemType.setData(aResponseData);
            }));
        },

        loadOrigin: function() {
            this.mOrigin.setData([]);
            var sURL = "/ws_restful_fsm_controller/service_call_origin";
            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(aResponseData) {
                self.mOrigin.setData(aResponseData);
            }));
        },
        
        oncontactValueHelp: function(oEvent) {
            var self = this;
            $.ajax("/ws_restful_fsm_controller/contact").done(function(aResponseData) {
            	SelectGenericDialog.getEntity({
            		sEntityPath: aResponseData,
	                aColumns: [
	                    { sHeader: self.getText("ContactSelect.firstname"), sField: "FIRST_NAME" },
	                    { sHeader: self.getText("ContactSelect.lastname"), sField: "LAST_NAME" },
	                    { sHeader: self.getText("ContactSelect.code"), sField: "CODE" },
	                    { sHeader: self.getText("ContactSelect.id"), sField: "ID" }
	                ]
            	}).done(function(oContact) {
            		self.mServiceCall.setProperty("/CONTACT_ID", oContact.ID);
            		self.mServiceCall.setProperty("/CONTACT_NAME", oContact.FIRST_NAME + " " + oContact.LAST_NAME);
                    self.getObjectModel().refresh(true);
            	});
            });
        },

        onEquipmentPress: function(oEvent) {
            var oInput = oEvent.getSource();
            var self = this;
            $.ajax("/ws_restful_fsm_controller/equipment").done(function(aResponseData) {
                SelectGenericDialog.getEntity({
                    sEntityPath: aResponseData,
                    aColumns: [
                        { sHeader: self.getText("Equipment.name"),  sField: "NAME"},
                        { sHeader: self.getText("Equipment.serialNumber"),  sField: "SERIAL_NUMBER"},
                        { sHeader: self.getText("Equipment.status"),  sField: "STATUS"},
                        { sHeader: self.getText("Equipment.type"),  sField: "TYPE"}
                    ]
                }).done(function(oEquipment) {
                    self.getObjectModel().getProperty("/equipments").push(oEquipment);
                    self.getObjectModel().refresh(true);
                });
            });
        },

        onResponsiblePress: function(oEvent) {
            var oInput = oEvent.getSource();
            var self = this;
            $.ajax("/ws_restful_fsm_controller/person").done(function(aResponseData) {
                SelectGenericDialog.getEntity({
                    sEntityPath: aResponseData,
                    aColumns: [
                        { sHeader: self.getText("Responsible.firstName"),   sField: "FIRST_NAME"},
                        { sHeader: self.getText("Responsible.lastName"),    sField: "LAST_NAME" },
                        { sHeader: self.getText("Responsible.jobTitle"),    sField: "JOB_TITLE" }
                    ]
                }).done(function(oResponsible) {
                    self.getObjectModel().getProperty("/responsibles").push(Object.assign(oResponsible, { ID: oResponsible.REF_ID }));
                    self.getObjectModel().refresh(true);
                });
            });
        },

        onRemoveEquipment: function(oEvent) {
            var sPath = oEvent.getParameter("listItem").getBindingContext().getPath();
            var iIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1));
            this.getObjectModel().getProperty("/equipments").splice(iIndex, 1);
            this.getObjectModel().refresh(true);
        },

        onRemoveResponsibles: function(oEvent) {
            var sPath = oEvent.getParameter("listItem").getBindingContext().getPath();
            var iIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1));
            this.getObjectModel().getProperty("/responsibles").splice(iIndex, 1);
            this.getObjectModel().refresh(true);
        },

        changeState: function(oEvent){
            sap.ushell.Container.setDirtyFlag(true);
            oEvent.getSource().setValueState("None");
        },

        onSave: function(oEvent) {
            var self = this;
           
            Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_fsm_controller/service_call",
                method: "POST",
                data: JSON.stringify([ this.mServiceCall.getData() ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.requestError", [ oResponseData.ErrorMsg ]));
                } else if (oResponseData.STATUS === "409") {
                    jQuery.sap.require("sap.m.MessageBox");
                    sap.m.MessageBox.show(self.getText("ToastMessage.createDuplicate"), {
                        title: self.getText("Dialog.success"),
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        actions: [
                            sap.m.MessageBox.Action.YES,
                            sap.m.MessageBox.Action.NO
                        ],
                        onClose: function(sAction) {
                            if (sAction === "YES") {
                                self.getRouter().navTo("detail", {
                                	ID_LOCAL: oResponseData.OBJECT_KEY
                                });
                            }
                        }
                    });
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.createSuccess"), {
                        closeOnBrowserNavigation: false
                    });
                    self.getRouter().navTo("detail", {
                        ID_LOCAL: oResponseData.OBJECT_KEY
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
            }));
        },
        
        minDueDateFormatter: function(sDate) {
            return new Date(sDate);
        }
    });
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.SelectGenericDialog, dep.fiori.lib.util.SelectEquipmentDialog));