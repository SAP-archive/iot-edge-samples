jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.MessageViewDialog");
jQuery.sap.require("dep.fiori.lib.util.Print");
jQuery.sap.require("dep.fiori.lib.util.UserStatus");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("sap.m.MessageBox");

(function(ListControllerBase, Filter, MessageViewDialog, Print, UserStatus, Utilities) {
ListControllerBase.extend("dep.fiori.workorder.app.list", {
    onInit: function() {
        this.setKey("AUFNR");
        this.setSortFragment("dep.fiori.workorder.app.listSort");
        this.setPrintObjType(Print.ObjectType.WorkOrder);
        ListControllerBase.prototype.onInit.apply(this, arguments);

        //this.mOData = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");
        this.mOData = new sap.ui.model.json.JSONModel();
        this.mOData.setData(null);
        this.getView().setModel(this.mOData, "odata");
        
        var oSorter = new sap.ui.model.Sorter("AUFNR", true);
        var oBinding = this.getTable().getBinding("items");
        oBinding.sort(oSorter);

        var self = this;
        $.when(
            $.ajax("/ws_restful_data_controller/workorder_userstatuses").done(function(aResponseData) {
                aResponseData = aResponseData || [];
                self.getView().setModel(new sap.ui.model.json.JSONModel(aResponseData), "userstatus");
            }),
            $.ajax("/ws_restful_data_controller/workcenter").done(function(aResponseData) {
                aResponseData = aResponseData || [];
                self.getView().setModel(new sap.ui.model.json.JSONModel(aResponseData), "workcenter");
            })
        ).done(function() {
            self.onRefresh();
        })
    },

    onRouteMatched: function(oEvent) {
        if (oEvent.getParameter("name") === "list") {
            var oNavArgs = oEvent.getParameter("arguments");
            this.setDetailBlock(oNavArgs["all*"]);
        }
    },

    onRefresh: function(oEvent) {
        var self = this;
        // Doing this synchronously is not a preferable solution, but there is a Chrome-specific
        // bug with large responses while others requests are pending, so if there are a lot
        // of work orders the UI5 libraries interfere with fetching the list
        var bAsync = !!this.mOData.getData(); // false the first time, true for refreshing
        this.mOData.setData({
            Workorder: []
        });
        Utilities.showBusyIndicator($.ajax({
            url: "/ws_restful_data_controller/workorder",
            async: bAsync
        }).done(function(aResponseData) {
            self.mOData.setData({
                Workorder: aResponseData
            });
        }));
    },
    
    onChangeStatus: function(oEvent) {
        var self = this;
        var sNewStatus = "REDY";
        sap.m.MessageBox.confirm(this.getText("Message.confirmStatusChange", sNewStatus), {
            onClose: function(sAction) {
                if (sAction === sap.m.MessageBox.Action.OK) {
                    var aContexts = self.getTable().getSelectedContexts();
                    var aWorkOrders = aContexts.map(function(oContext) { return oContext.getModel().getProperty(oContext.getPath()); });
                    Utilities.showBusyIndicator(self.updateMultipleUserStatus(aWorkOrders, sNewStatus));
                }
            }
        });
    },
    
    updateMultipleUserStatus: function(aWorkOrders, sNewStatus) {
        var self = this;
        var oDeferred = $.Deferred();
        var aResults = [];
        
        // Can't lock multiple work orders at once so
        // wait for previous work order status change
        // to complete before beginning next one
        (function fnUpdateStatus(i) {
            if (i < aWorkOrders.length) {
                self.updateUserStatus(aWorkOrders[i], sNewStatus).done(function(sInfo) {
                    aResults.push({
                        AUFNR: aWorkOrders[i].AUFNR,
                        info: sInfo
                    });
                }).fail(function(sError) {
                    aResults.push({
                        AUFNR: aWorkOrders[i].AUFNR,
                        error: sError
                    });
                }).always(function() {
                    if (aResults.length === aWorkOrders.length) {
                        self.showStatusChangeResults(aResults);
                        oDeferred.resolve();
                    } else {
                        fnUpdateStatus(i + 1);
                    }
                });
            }
        })(0);
        
        return oDeferred.promise();
    },
    
    updateUserStatus: function(oWorkOrder, sNewStatus) {
        var self = this;
        var oDeferred = $.Deferred();
        
        var sCurrStatus = oWorkOrder.USER_STATUS.substring(0, 4);
        if (sCurrStatus !== sNewStatus) {
            var bCanChange = UserStatus.validUserStatusFormatter(sNewStatus, oWorkOrder.USER_STATUS);
            if (bCanChange) {
                // Get details required for status change request
                self.getWorkOrderDetail(oWorkOrder.AUFNR).done(function(oResponseData) {
                    oWorkOrder = oResponseData;
                    oWorkOrder.USER_STATUS = sNewStatus + oWorkOrder.USER_STATUS.substring(4);
                    oWorkOrder.MOBILE_STATUS = sNewStatus;
                    
                    // Acquire work order lock
                    Utilities.acquireLock("workorder", oWorkOrder.AUFNR).done(function() {
                        var oReleasePromise = null;
                        
                        // Update status and return result after lock is released
                        self.saveUserStatus(oWorkOrder).always(function() {
                            // Release work order lock
                            oReleasePromise = Utilities.releaseLock("workorder");
                        }).done(function(oResponseData) {
                            oReleasePromise.always(function() {
                                oDeferred.resolve();
                            });
                        }).fail(function(oResponseData) {
                            oReleasePromise.always(function() {
                                var sError = Utilities.geti18nGlobal("Error.communicationError");
                                if (oResponseData) {
                                    sError = Utilities.geti18nGlobal("Error.requestError", oResponseData.ErrorMsg);
                                }
                                oDeferred.reject(sError);
                            });
                        });
                    }).fail(function(oResponseData) {
                        var sError = Utilities.geti18nGlobal("Error.communicationError");
                        if (oResponseData) {
                            if (oResponseData.ErrorID) {
                                sError = Utilities.geti18nGlobal("Error.requestError", oResponseData.ErrorMsg);
                            } else {
                                sError = self.getText("ToastMessage.Locked", oResponseData.LOCKED_BY_USER);
                            }
                        }
                        oDeferred.reject(sError);
                    });
                }).fail(function(oResponseData) {
                    var sError = Utilities.geti18nGlobal("Error.communicationError");
                    if (oResponseData) {
                        sError = Utilities.geti18nGlobal("Error.requestError", oResponseData.ErrorMsg);
                    }
                    oDeferred.reject(sError);
                });
            } else {
                oDeferred.reject(self.getText("Message.cannotChangeStatus", [ sCurrStatus, sNewStatus ]));
            }
        } else {
            oDeferred.resolve(self.getText("Message.noStatusChangeNeeded", sNewStatus));
        }
        
        return oDeferred.promise();
    },
    
    getWorkOrderDetail: function(sAUFNR) {
        var oDeferred = $.Deferred();
        
        var sURL = "/ws_restful_data_controller/workorder?AUFNR=" + sAUFNR;
        $.ajax(sURL).done(function(oResponseData) {
            oResponseData = Array.isArray(oResponseData) ? oResponseData[0] : oResponseData;
            if (oResponseData.ErrorID) {
                oDeferred.reject(oResponseData);
            } else {
                oDeferred.resolve(oResponseData);
            }
        }).fail(function() {
            oDeferred.reject();
        });
        
        return oDeferred.promise();
    },
    
    saveUserStatus: function(oWorkOrder) {
        var oDeferred = $.Deferred();
        
        var sURL = "/ws_restful_data_controller/workorder_userstatuses?AUFNR=" + oWorkOrder.AUFNR
        $.ajax({
            url: sURL,
            method: "PUT",
            data: JSON.stringify(oWorkOrder)
        }).done(function(oResponseData) {
            oResponseData = Array.isArray(oResponseData) ? oResponseData[0] : oResponseData;
            if (oResponseData.ErrorID) {
                oDeferred.reject(oResponseData);
            } else {
                oDeferred.resolve(oResponseData);
            }
        }).fail(function() {
            oDeferred.reject();
        });
        
        return oDeferred.promise();
    },
    
    showStatusChangeResults: function(aResults) {
        var self = this;
        var aMessages = aResults.map(function(oResult) {
            var sType = "";
            var sTitle = "";
            var sSubtitle = "";
            
            if (oResult.error) {
                sType = sap.ui.core.MessageType.Error;
                sTitle = self.getText("Message.statusChangeFailed", oResult.AUFNR);
                sSubtitle = oResult.error;
            } else if (oResult.info) {
                sType = sap.ui.core.MessageType.Information;
                sTitle = self.getText("Message.statusChangeUnnecessary", oResult.AUFNR);
                sSubtitle = oResult.info;
            } else {
                sType = sap.ui.core.MessageType.Success,
                sTitle = self.getText("Message.statusChangeSuccess", oResult.AUFNR);
            }
            
            return {
                type: sType,
                title: sTitle,
                subtitle: sSubtitle
            };
        });
        
        MessageViewDialog.showMessages(this.getText("Message.statusChangeResults"), aMessages).done(function() {
            self.onRefresh();
        });
    },
    
    getFilterItems: function() {
        return [
            { key: "AUFNR", label: "{i18n>Workorder.number}" },
            { key: "KTEXT", label: "{i18nGlobal>General.description}" },
            { key: "USER_STATUS", label: "{i18n>Workorder.userStatus}", type: Filter.InputType.MultiSelect, 
              items: { path: "userstatus>/", key: "{userstatus>STATUS_CODE}", text: "{userstatus>STATUS_CODE}", additionalText: "{userstatus>STATUS_DESC}" } },
            { key: "EQUNR", label: "{i18nGlobal>General.equipment}" },
            { key: "VAPLZ", label: "{i18n>Form.workcenterLabel}", type: Filter.InputType.MultiSelect,
              items: { path: "workcenter>/", key: "{workcenter>VAPLZ}", text: "{workcenter>VAPLZ}", additionalText: "{workcenter>KTEXT}" } },
            { key: "GLTRP", label: "{i18n>Workorder.dueDate}", type: Filter.InputType.DateRange },
            this.getEdgeErrorFilterItem()
        ];
    }
});
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter, dep.fiori.lib.util.MessageViewDialog, dep.fiori.lib.util.Print, dep.fiori.lib.util.UserStatus, dep.fiori.lib.util.Utilities));