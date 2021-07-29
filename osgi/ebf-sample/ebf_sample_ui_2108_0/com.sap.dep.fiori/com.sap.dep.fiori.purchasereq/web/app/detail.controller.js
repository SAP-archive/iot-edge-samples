jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.SelectPRMaterialDialog");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, DataAccess, SelectPRMaterialDialog, Utilities) {
    DetailControllerBase.extend("dep.fiori.purchasereq.app.detail", {
        onInit: function() {
            this.setKey("PR_NO_LOCAL");
            DetailControllerBase.prototype.onInit.apply(this, arguments);
    
            this.mPurchaseReq = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mPurchaseReq);
    
            this.mAttachments = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mAttachments, "attachments");
    
            this.mUpload = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mUpload, "upload");
    
            this.mEditLTXT = new sap.ui.model.json.JSONModel({
                editable: false
            });
            this.getView().setModel(this.mEditLTXT, "ltxtEdit");
    
            var self = this;
            dep.fiori.lib.util.DataAccess.getLookupModel({
                unit: "units_of_measure",
                currency: "currencies",
                freightMode: "freight_modes"
            }).done(function(mLookup) {
                self.getView().setModel(mLookup, "lookup");
            });
        },
    
        loadData: function(sPR) {
            this.mPurchaseReq.setData({});
            this.loadPurchaseReq(sPR);
        },
    
        refresh: function(oEvent) {
            this.loadPurchaseReq(this.mPurchaseReq.getProperty("/PR_NO_LOCAL"));
        },
    
        loadPurchaseReq: function(sPurchaseReq) {
            var self = this;
            var oPromise = $.ajax("/ws_restful_data_controller/purchase_requisitions?PR_NO_LOCAL=" + sPurchaseReq).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
    
                if (oResponseData && !oResponseData.ErrorID) {
                    oResponseData.PRItemArray = JSON.parse(oResponseData.PRItemArray);
                    self.mPurchaseReq.setData(oResponseData);
                    self.loadAttachments(oResponseData.BANFN);
                } else {
                    self.getRouter().navTo("display", {}, true);
                }
            });
    
            return Utilities.showBusyIndicator(oPromise);
        },
    
        refreshAttachments: function(oEvent) {
            Utilities.showBusyIndicator(this.loadAttachments(this.mPurchaseReq.getProperty("/BANFN")));
        },
    
        loadAttachments: function(sPurchaseReq) {
            this.mAttachments.setData([]);
    
            var self = this;
            return $.ajax("/ws_restful_data_controller/attachment?OBJID=" + sPurchaseReq).done(function(oResponseData) {
                self.mAttachments.setData(oResponseData);
            });
        },
    
        reloadLTXT: function() {
            var sPurchaseReq = this.mPurchaseReq.getProperty("/PR_NO_LOCAL");
    
            var self = this;
            return $.ajax("/ws_restful_data_controller/purchase_requisition_ltxt?PR_NO_LOCAL=" + sPurchaseReq).done(function(oResponseLTXT) {
                if (Array.isArray(oResponseLTXT)) {
                    oResponseLTXT = oResponseLTXT[0];
                }
                self.mPurchaseReq.setProperty("/TDTXT", oResponseLTXT.LTXT);
            });
        },
    
        onAddPRItem: function(oEvent) {
            var self = this;
            SelectPRMaterialDialog.getMaterial().done(function(aMaterials) {
                for (var i = 0; i < aMaterials.length; i++) {
                    self.addItemToPR(aMaterials[i]);
                }
                Utilities.showBusyIndicator(self.savePurchaseReq());
            });
        },
    
        addItemToPR: function(oMaterial) {
            var oPurchaseReq = this.mPurchaseReq.getData();
    
            // Set the line number to 1 higher than the current highest, left padded to 5 digits
            var sBNFPO = "00000";
            for (var i = 0; i < oPurchaseReq.PRItemArray.length; i++) {
                if (oPurchaseReq.PRItemArray[i].BNFPO > sBNFPO) {
                    sBNFPO = oPurchaseReq.PRItemArray[i].BNFPO;
                }
            }
            sBNFPO = String("00000" + (Number(sBNFPO) + 1)).slice(-5);
    
            // The order of these properties matters and they cannot be undefined
            oMaterial = {
                MAINT_PLANT_RIG: oMaterial.WERKS || null,
                PR_NO_LOCAL: oPurchaseReq.PR_NO_LOCAL,
                BNFPO: sBNFPO,
                BANFN: oPurchaseReq.BANFN,
                FRGZU: "",
                TXZ01: oMaterial.MAKTX || null,
                MATNR: oMaterial.MATNR || null,
                MEINS: oMaterial.MEINS || null,
                RESWK: oPurchaseReq.PRItemArray[0].RESWK || null,
                MENGE: oMaterial.REQQTY || "0",
                LFDAT: oMaterial.LFDAT || Utilities.date.currDateFormatted(),
                PREIS: oMaterial.PREIS || null,
                FREIGHT_MODE: " ",
                WAERS: oPurchaseReq.PRItemArray[0].WAERS || null,
                LGPBE: oMaterial.LGPBE || null,
                LGPRO: " ",
                MAABC: oMaterial.MAABC || null,
                ZMATNR: " ",
                ZMAKTX: " ",
                ZLGPBE: " ",
                ZLGORT: " ",
                ZMAABC: " ",
                LOEKZ: " ",
                IS_CHANGED: "I",
                WI_ID: null,
                BANPR: "",
                FRGKZ: "",
                BSTMI: oMaterial.BSTMI || null,
                BSTMA: oMaterial.BSTMA || null,
                EBELN: " ",
                KNTTP: "",
                EBELN_LIST: null
            };
    
            oPurchaseReq.PRItemArray.push(oMaterial);
            this.mPurchaseReq.refresh();
        },
    
        openEditPRItemDialog: function(oModelData) {
            if (!this.oEditDialog) {
                this.oEditDialog = sap.ui.xmlfragment("dep.fiori.purchasereq.app.editPRItem", this);
                this.oEditDialog.setModel(new sap.ui.model.json.JSONModel(), "item");
                this.getView().addDependent(this.oEditDialog);
            }
            oModelData.IS_CHANGED='U';
            this.oEditDialog.getModel("item").setData(oModelData);
    
            // Check/acquire lock
            var self = this;
            this.acquireLock().done(function() {
                self.oEditDialog.open();
            });
        },
    
        onEditPRItem: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            this.openEditPRItemDialog(oContext.getModel().getProperty(oContext.getPath()));
        },
    
        onSavePRItem: function(oEvent) {
            // The item model still references the original one, so just use that
            var self = this;
            return this.savePurchaseReq().done(function(oResponseData) {
                self.releaseLock();
                self.oEditDialog.close();
            });
        },
    
        savePurchaseReq: function() {
            var self = this;
            return $.ajax({
                url: "/ws_restful_data_controller/purchase_requisitions",
                method: "PUT",
                data: this.mPurchaseReq.getJSON(),
                contentType: "application/json"
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
    
                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.SaveSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            });
        },
    
        onCloseEditPRItem: function(oEvent) {
            this.releaseLock();
            this.oEditDialog.close();
        },
    
        afterCloseEditPRItem: function(oEvent) {
            this.oEditDialog.getModel("item").setData({});
            this.loadPurchaseReq(this.mPurchaseReq.getProperty("/PR_NO_LOCAL"));
        },
    
        onDeletePRItem: function(oEvent) {
            var oContext = oEvent.getParameter("listItem").getBindingContext();
            var oMaterial = oContext.getModel().getProperty(oContext.getPath());
    
            var self = this;
            jQuery.sap.require("sap.m.MessageBox");
            sap.m.MessageBox.show(this.getText("PRItem.confirmDelete", [ oMaterial.MATNR ]), {
                title: Utilities.geti18nGlobal("General.warning"),
                icon: sap.m.MessageBox.Icon.WARNING,
                actions: [
                    sap.m.MessageBox.Action.OK,
                    sap.m.MessageBox.Action.CANCEL
                ],
                onClose: function(sAction) {
                    if (sAction === "OK") {
                        self.deletePRItem(oMaterial.PR_NO_LOCAL, oMaterial.BNFPO);
                    }
                }
            });
        },
    
        deletePRItem: function(sPurchaseReq, sBNFPO) {
            var self = this;
            return $.ajax({
                url: "/ws_restful_data_controller/purchase_requisitions?PR_NO_LOCAL=" + sPurchaseReq + "&BNFPO=" + sBNFPO,
                method: "DELETE"
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
    
                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    self.loadPurchaseReq(sPurchaseReq);
                    sap.m.MessageToast.show(self.getText("ToastMessage.DeleteSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            });
        },
    
        onDescriptionEdit: function(oEvent) {
            this.mEditLTXT.setProperty("/editable", true);
        },
    
        onDescriptionCancel: function(oEvent) {
            this.mEditLTXT.setProperty("/editable", false);
            this.reloadLTXT();
        },
    
        onDescriptionSave: function(oEvent) {
            var self = this;
            this.savePurchaseReq().done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
    
                if (oResponseData.STATUS && oResponseData.STATUS === "200") {
                    self.loadPurchaseReq(self.mPurchaseReq.getProperty("/PR_NO_LOCAL"));
                    self.mEditLTXT.setProperty("/editable", false);
                }
            });
        },
    
        onDownload: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("attachments");
            var oAttachment = oContext.getModel().getProperty(oContext.getPath());
            Utilities.downloadAttachment(oAttachment);
        },
    
        onAddAttachment: function(oEvent) {
            var oUploader = this.getView().byId("upload");
    
            if (oUploader.getValue()) {
                oUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "FILENAME",
                    value: this.mUpload.getProperty("/filepath")
                }));
                oUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "OBJID",
                    value: this.mPurchaseReq.getProperty("/BANFN")
                }));
                oUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                    name: "ITEMCODE",
                    value: "BUS2105"
                }));
    
                this.oUploadPromise = Utilities.showBusyIndicator($.Deferred());
                oUploader.upload();
            }
        },
    
        onUploadComplete: function(oEvent) {
            this.oUploadPromise.resolve();
            this.mUpload.setData(null);
    
            if (oEvent.getParameter("status") === 200 &&
                oEvent.getParameter("responseRaw") === "[]") {
    
                this.loadAttachments(this.mPurchaseReq.getProperty("/BANFN"));
            } else {
    
            }
        },
    
        onEditAttachment: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("attachments");
            var mAttachments = oContext.getModel();
            var sPath = oContext.getPath();
            var oAttachment = mAttachments.getProperty(sPath);
            var sNewDesc = oAttachment.FILEDESC.replace("." + oAttachment.FILETYPE, "");
    
            mAttachments.setProperty(sPath + "/newDesc", sNewDesc);
            mAttachments.setProperty(sPath + "/editable", true);
        },
    
        onSaveAttachment: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("attachments");
            var oAttachment = oContext.getModel().getProperty(oContext.getPath());
            $.ajax({
                url: "/ws_restful_data_controller/attachment",
                method: "POST",
                data: JSON.stringify(oAttachment)
            });
        },
    
        onCancelAttachment: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("attachments");
            oContext.getModel().setProperty(oContext.getPath() + "/editable", false);
        },
    
        statusFormatter: function(sStatus) {
            return this.getText("PRStatus." + sStatus);
        },
    
        acquireLock: function(bOverride) {
            var self = this;
            var sPR = this.mPurchaseReq.getProperty("/PR_NO_LOCAL");
            
            var oDeferred = $.Deferred();
            Utilities.showBusyIndicator(
                Utilities.acquireLock("purchasereq", sPR, bOverride).done(function() {
                    oDeferred.resolve();
                }).fail(function(oResponseData) {
                    if (oResponseData) {
                        jQuery.sap.require("sap.m.MessageBox");
                        sap.m.MessageBox.show(self.getText("ToastMessage.Locked", [ oResponseData.LOCKED_BY_USER ]), {
                            title: Utilities.geti18nGlobal("General.warning"),
                            icon: sap.m.MessageBox.Icon.WARNING,
                            actions: [
                                self.getText("Lock.override"),
                                sap.m.MessageBox.Action.OK
                            ],
                            onClose: function(sAction) {
                                if (sAction === self.getText("Lock.override")) {
                                    self.acquireLock(true).done(oDeferred.resolve).fail(oDeferred.reject);
                                }
                            }
                        });
                    } else {
                        sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
                        oDeferred.reject();
                    }
                })
            );
            return oDeferred.promise();
        },
    
        releaseLock: function(oEvent) {
            Utilities.showBusyIndicator(Utilities.releaseLock("purchasereq"));
        },
    
        handleResponsivePopoverPress: function(oEvent) {
            jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
            var aTransactions = this.mPurchaseReq.getProperty("/EDGE_ERRORS").split(',');
            dep.fiori.lib.util.ErrorPopover.openBy(oEvent.getSource(), aTransactions);
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.SelectPRMaterialDialog, dep.fiori.lib.util.Utilities));