jQuery.sap.require("dep.fiori.assignment.app.Constants");
jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("sap.m.MessageBox");

(function(Constants, ListControllerBase, Filter, Utilities) {
    ListControllerBase.extend("dep.fiori.assignment.app.list", {
        onInit: function() {
            this.setSortFragment("dep.fiori.assignment.app.listSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);

            this.populateFilterSelects();

            this.mPage = new sap.ui.model.json.JSONModel({ "pendingChanges": false });
            this.getView().setModel(this.mPage, "page");

            this.mOData = this.getODataModel();
        },

        onRouteMatched: function(oEvent) {
            var sRoute = oEvent.getParameter("name");
            if (sRoute === "mytasks") {
                this.setDefaultFilterData({ "PLANTUSER": { value: sap.ushell.Container.getUser().getId() } });
                this.mPage.setProperty("/currentUserList", true);
            } else {
                this.setDefaultFilterData({});
                this.mPage.setProperty("/currentUserList", false);
            }
            this.mOData.resetChanges();
        },

        populateFilterSelects: function() {
            var self = this;
            $.ajax("/ws_restful_data_controller/assignment_type").done(function(aResponseData) {
                aResponseData = aResponseData || [];
                self.getView().setModel(new sap.ui.model.json.JSONModel(aResponseData), "assignmentTypes");
            });

            $.ajax("/ws_restful_data_controller/assignment_status").done(function(aResponseData) {
                aResponseData = aResponseData || [];
                self.getView().setModel(new sap.ui.model.json.JSONModel(aResponseData), "assignmentStatuses");
            });
        },

        getFilterItems: function() {
            return [
                { key: "OBJTYPE", label: "{i18n>Assignment.type}", type: Filter.InputType.MultiSelect,
                  items: { path: "assignmentTypes>/", key: "{assignmentTypes>TYPE}", text: "{assignmentTypes>TEXT}" } },
                { key: "OBJKEY", label: "{i18n>Assignment.objKey}" },
                { key: "OBJSUBKEY", label: "{i18n>Assignment.objSubKey}" },
                { key: "PLANTUSER", label: "{i18n>Assignment.user}", visible: "{= !${page>/currentUserList} }" },
                { key: "STATUS", label: "{i18n>Assignment.status}", type: Filter.InputType.MultiSelect,
                  items: { path: "assignmentStatuses>/", key: "{assignmentStatuses>STATUS}", text: "{assignmentStatuses>TEXT}" } }
            ];
        },

        onSelectStatus: function(oEvent) {
            this.mPage.setProperty("/pendingChanges", this.mOData.hasPendingChanges());
        },

        onSave: function(oEvent) {
            var self = this;
            var oPendingChanges = this.mOData.getPendingChanges();
            this.iTotalCount = Object.keys(oPendingChanges).length;
            this.iCompletedCount = 0;
            this.iFailedCount = 0;

            for (var sKey in oPendingChanges) {
                var oRequestData = this.mOData.getProperty("/" + sKey);
                Utilities.showBusyIndicator($.ajax({
                    url: "/ws_restful_data_controller/task_assignment",
                    method: "PUT",
                    data: JSON.stringify([ oRequestData ]),
                    complete: function(oResponseData) {
                        self.onUpdateComplete(oResponseData);
                    }
                }));
            }
        },

        onUpdateComplete: function(oResponseData) {
            this.iCompletedCount++;

            var oResponse = jQuery.parseJSON(oResponseData.responseText);
            if (oResponse[0].STATUS !== "200") {
                this.iFailedCount++;
            }

            if (this.iCompletedCount === this.iTotalCount) {
                var sMessage = this.iFailedCount > 0 ? this.getText("ToastMessage.updateError") : this.getText("ToastMessage.updateSuccess");
                sap.m.MessageToast.show(sMessage);
                this.getTable().getBinding("items").refresh();
                this.mPage.setProperty("/pendingChanges", false);
            }
        },

        onCancel: function(oEvent) {
            this.mOData.resetChanges();
            this.mPage.setProperty("/pendingChanges", false);
            sap.m.MessageToast.show(this.getText("ToastMessage.changesDiscarded"))
        },

        onListItemSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("odata");
            var oObject = oContext.getObject();
            console.log(oObject)
            if (oObject.OBJTYPE === 'WO') {
                Utilities.navToExternal("#depWorkorder-display&/" + oObject.OBJKEY);
            } else if (oObject.OBJTYPE === 'OP') {
                Utilities.navToExternal("#depWorkorder-display&/" + oObject.OBJKEY + "/operations/" + oObject.OBJSUBKEY);
            } else if (oObject.OBJTYPE === 'PID') {
                $.ajax("/dep/odata/Physical_Inventory_Documents?$filter=INV_NO_LOCAL eq '" + oObject.OBJKEY + "'").done(function(oResponseData) {
                    var oPIDoc = oResponseData.d.results[0];
                    Utilities.navToExternal("#depInventory-display&/" + oObject.OBJKEY + "/" + oPIDoc.LGORT + "/" + oPIDoc.GJAHR);
                });
            }
        },

        onDelete: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("odata");
            var oAssignment = oContext.getModel().getProperty(oContext.getPath());

            var self = this;
            sap.m.MessageBox.show(this.getText("Message.confirmDelete", [ oAssignment.PLANTUSER ]), {
                title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.warning"),
                icon: sap.m.MessageBox.Icon.WARNING,
                actions: [
                    sap.m.MessageBox.Action.OK,
                    sap.m.MessageBox.Action.CANCEL
                ],
                onClose: function(sAction) {
                    if (sAction === sap.m.MessageBox.Action.OK) {
                        self.deleteAssignment(oAssignment);
                    }
                }
            });
        },

        deleteAssignment: function(oAssignment) {
            var self = this;
            Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/task_assignment",
                method: "DELETE",
                headers: {
                    PLANTUSER: oAssignment.PLANTUSER,
                    OBJTYPE: oAssignment.OBJTYPE,
                    OBJKEY: oAssignment.OBJKEY,
                    OBJSUBKEY: oAssignment.OBJSUBKEY
                }
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.requestError", [ oResponseData.ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.deleteSuccess"));
                    self.getTable().getBinding("items").refresh();
                }
            }).fail(function() {
                sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
            }));
        },

        onToggleLock: function(oEvent) {
            var bPressed = oEvent.getParameter("pressed");
            var oToggleButton = oEvent.getSource();
            var oContext = oToggleButton.getBindingContext("odata");
            var oAssignment = oContext.getModel().getProperty(oContext.getPath());

            if (bPressed) {
                this.acquireMobileLock(oAssignment, oToggleButton);
            } else {
                this.releaseMobileLock(oAssignment, oToggleButton);
            }
        },

        acquireMobileLock: function(oAssignment, oToggleButton, bOverride) {
            var self = this;
            var sMethod = bOverride ? "PUT" : "POST";
            Utilities.showBusyIndicator($.ajax({
                url: this.getLockUrl(oAssignment.OBJTYPE),
                method: sMethod,
                headers: {
                    OBJ_KEY: oAssignment.OBJKEY,
                    LOCK_TYPE: Constants.LockType.MOBILE
                }
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.requestError", [ oResponseData.ErrorMsg ]));
                    oToggleButton.setPressed(false);
                } else {
                    if (oResponseData.LOCK_MESSAGE === "OK") {
                        sap.m.MessageToast.show(self.getText("ToastMessage.lockSuccess"));
                        self.getTable().getBinding("items").refresh();
                    } else {
                        sap.m.MessageBox.show(self.getText("Message.unableToLock", [ oResponseData.LOCKED_BY_USER ]), {
                            title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.warning"),
                            icon: sap.m.MessageBox.Icon.WARNING,
                            actions: [
                                self.getText("Lock.override"),
                                sap.m.MessageBox.Action.OK
                            ],
                            onClose: function(sAction) {
                                if (sAction === self.getText("Lock.override")) {
                                    self.acquireMobileLock(oAssignment, oToggleButton, true);
                                } else {
                                    oToggleButton.setPressed(false);
                                }
                            }
                        });
                    }

                }
            }).fail(function() {
                sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
            }));
        },

        releaseMobileLock: function(oAssignment, oToggleButton) {
            var self = this;
            Utilities.showBusyIndicator($.ajax({
                url: this.getLockUrl(oAssignment.OBJTYPE),
                method: "DELETE",
                headers: {
                    OBJ_KEY: oAssignment.OBJKEY,
                    LOCK_TYPE: Constants.LockType.MOBILE
                }
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.requestError", [ oResponseData.ErrorMsg ]));
                    oToggleButton.setPressed(true);
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.unlockSuccess"));
                    self.getTable().getBinding("items").refresh();
                }
            }).fail(function() {
                sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
            }));
        },

        getLockUrl: function(sAssignmentType) {
            var sUrl = "/ws_restful_lock_controller/";
            switch(sAssignmentType) {
                case Constants.AssignmentType.WORKORDER:
                case Constants.AssignmentType.OPERATION:
                    sUrl += "workorder";
                    break;
                case Constants.AssignmentType.PHYS_INV_DOC:
                    sUrl += "pinventory";
                    break;
            }
            return sUrl;
        },

        objKeysFormatter: function(sKey, sSubKey) {
            var sText = sKey;
            if (sSubKey) {
                sText += " / " + sSubKey;
            }
            return sText;
        }
    });
}(dep.fiori.assignment.app.Constants, dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter, dep.fiori.lib.util.Utilities));