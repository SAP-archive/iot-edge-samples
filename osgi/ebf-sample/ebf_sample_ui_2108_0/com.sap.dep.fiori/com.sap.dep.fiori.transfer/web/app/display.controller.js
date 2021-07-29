jQuery.sap.require("dep.fiori.lib.controller.ControllerBase");
jQuery.sap.require("dep.fiori.lib.util.SelectMaterialDialog");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(ControllerBase, SelectMaterialDialog, Utilities) {
    ControllerBase.extend("dep.fiori.transfer.app.display", {
        onInit: function() {
            this.mMaterials = new sap.ui.model.json.JSONModel([]);
            this.getView().setModel(this.mMaterials);

            this.mPlants = new sap.ui.model.json.JSONModel([]);
            this.getView().setModel(this.mPlants, "plants");

            this.mLocations = new sap.ui.model.json.JSONModel([]);
            this.getView().setModel(this.mLocations, "locations");

            this.mValuation = new sap.ui.model.json.JSONModel("/ws_restful_data_controller/valuation_categories");
            this.getView().setModel(this.mValuation, "valuation");

            this.mBody = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mBody, "body");

            this.mOData = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");
            this.getView().setModel(this.mOData, "odata");

            var self = this;
            $.ajax("/ws_restful_data_controller/other_plants").done(function(aResponseData) {
                self.mPlants.setData(aResponseData);
                self.refreshStorageLocations(aResponseData[0].WERKS);
            });

            $.ajax("/ws_restful_data_controller/movement_type_trans_to_plant").done(function(aResponseData) {
                var oResponseData = aResponseData[0];
                self.sBWART = oResponseData.BWART;
            });
        },

        onChangeDestination: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var sWERKS = oSelectedItem.getKey();
            this.mBody.setProperty("/UMWRK", sWERKS);
            this.refreshStorageLocations(sWERKS);
            this.mMaterials.setData([]);
        },

        refreshStorageLocations: function(sWERKS) {
            var self = this;
            $.ajax("/ws_restful_data_controller/storage_locations_for_plant?WERKS=" + sWERKS).done(function(aResponseData) {
                self.mLocations.setData(aResponseData);
                self.mBody.setProperty("/UMLGO", aResponseData[0].LGORT);
            });
        },

        onAddMaterial: function(oEvent) {
            var self = this;
            SelectMaterialDialog.getMaterial("/Inter_Plant_Transfer_Materials").done(function(aNewMaterials) {
                var aValid = [];
                var aInvalid = [];
                var aFailed = [];

                if (aNewMaterials.length > 0) {
                    var oPromise = Utilities.showBusyIndicator($.Deferred());
                    for (var i = 0; i < aNewMaterials.length; i++) {
                        var oMaterial = aNewMaterials[i];
                        var sQuery = Utilities.getQueryString({
                            MATNR: oMaterial.MATNR,
                            UMWRK: self.mBody.getProperty("/UMWRK"),
                            BWART: self.sBWART
                        });
                        var sURL = "/ws_restful_data_controller/inter_plant_transfer" + sQuery;

                        (function(oMaterial) {
                            $.ajax(sURL).done(function(oResponseData) {
                                if (Array.isArray(oResponseData)) {
                                    oResponseData = oResponseData[0];
                                }

                                // "0" represents the ability to add (absence of an error)
                                if (oResponseData.CAN_ADD === "0") {
                                    aValid.push(oMaterial);
                                } else {
                                    aInvalid.push(oMaterial);
                                }

                                self.onMaterialCheckComplete(oPromise, aNewMaterials.length, aValid, aInvalid, aFailed);
                            }).fail(function() {
                                aFailed.push(oMaterial);
                                self.onMaterialCheckComplete(oPromise, aNewMaterials.length, aValid, aInvalid, aFailed);
                            });
                        })(oMaterial);
                    }
                }
            });
        },

        onMaterialCheckComplete: function(oPromise, iNumMaterials, aValid, aInvalid, aFailed) {
            var self = this;
            if (aValid.length + aInvalid.length + aFailed.length === iNumMaterials) {
                if (aFailed.length > 0) {
                    oPromise.reject();
                    self.selectMaterialError(self.getText("ToastMessage.CommunicationError"));
                } else if (aInvalid.length > 0) {
                    oPromise.resolve();
                    var sWarning = self.getText("ToastMessage.InvalidMaterial", aInvalid.map(function(oMaterial) { return oMaterial.MATNR; }).join(","));
                    jQuery.sap.require("sap.m.MessageBox");
                    sap.m.MessageBox.show(sWarning, {
                        title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.warning"),
                        icon: sap.m.MessageBox.Icon.WARNING,
                        actions: [
                            sap.m.MessageBox.Action.OK
                        ],
                        onClose: function(sAction) {
                            if (sAction === sap.m.MessageBox.Action.OK) {
                                self.addMaterials(aValid);
                            }
                        }
                    });
                } else {
                    oPromise.resolve();
                    self.addMaterials(aValid);
                }
            }
        },

        addMaterials: function(aNewMaterials) {
            var self = this;
            var aValid = [];
            var aInvalid = [];
            var aFailed = [];

            if (aNewMaterials.length > 0) {
                var oPromise = Utilities.showBusyIndicator($.Deferred());
                for (var i = 0; i < aNewMaterials.length; i++) {
                    var oMaterial = aNewMaterials[i];
                    sQuery = Utilities.getQueryString({
                        MATNR: oMaterial.MATNR,
                        LGORT: oMaterial.LGORT
                    });
                    sURL = "/ws_restful_data_controller/materials" + sQuery;

                    (function(oMaterial) {
                        $.ajax(sURL).done(function(aResponseData) {
                            if (aResponseData.length) {
                                aValid.push(aResponseData[0]);
                            } else {
                                aInvalid.push(oMaterial);
                            }
                            self.onMaterialAddComplete(oPromise, aNewMaterials.length, aValid, aInvalid, aFailed);
                        }).fail(function() {
                            aFailed.push(oMaterial);
                            self.onMaterialAddComplete(oPromise, aNewMaterials.length, aValid, aInvalid, aFailed);
                        });
                    })(oMaterial);
                }
            }
        },

        onMaterialAddComplete: function(oPromise, iNumMaterials, aValid, aInvalid, aFailed) {
            if (aValid.length + aInvalid.length + aFailed.length === iNumMaterials) {
                if (aFailed.length > 0) {
                    oPromise.reject();
                    this.selectMaterialError(this.getText("ToastMessage.CommunicationError"));
                } else {
                    if (aInvalid.length > 0) {
                        var sMaterials = aInvalid.map(function(oMaterial) { return oMaterial.MATNR; }).join(",");
                        this.selectMaterialError(this.getText("ToastMessage.MissingMaterial", sMaterials));
                    }
                    var aMaterials = this.mMaterials.getData();
                    aMaterials.push.apply(aMaterials, aValid);
                    this.mMaterials.refresh();
                    oPromise.resolve();
                }
            }
        },

        selectMaterialError: function(sText) {
            var self = this;
            jQuery.sap.require("sap.m.MessageBox");
            sap.m.MessageBox.show(sText, {
                title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.error"),
                icon: sap.m.MessageBox.Icon.ERROR,
                actions: [
                    sap.m.MessageBox.Action.RETRY,
                    sap.m.MessageBox.Action.CANCEL
                ],
                onClose: function(sAction) {
                    if (sAction === "RETRY") {
                        self.onAddMaterial();
                    }
                }
            });
        },

        onRemoveMaterial: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var sIndex = oListItem.getBindingContext().getPath().substring(1);
            var aMaterials = this.mMaterials.getData();
            aMaterials.splice(sIndex, 1);
            this.mMaterials.refresh();
        },

        onSave: function(oEvent) {
            var oRequestBody = {
                MJAHR: new Date().getFullYear(),
                BUDAT: Utilities.date.currDateFormatted(),
                BLDAT: Utilities.date.currDateFormatted(),
                TransfersArr: this.mMaterials.getData()
            };

            var bValid = true;
            for (var i = 0; i < oRequestBody.TransfersArr.length; i++) {
                var iERFMG = oRequestBody.TransfersArr[i].ERFMG;
                var iQUANT = oRequestBody.TransfersArr[i].QUANT;
                if (!iERFMG || iERFMG < 1 || iERFMG > iQUANT) {
                    bValid = false;
                    break;
                }

                oRequestBody.TransfersArr[i].BWART = this.sBWART;
                oRequestBody.TransfersArr[i].UMWRK = this.mBody.getProperty("/UMWRK");
                oRequestBody.TransfersArr[i].UMLGO = this.mBody.getProperty("/UMLGO");
                oRequestBody.TransfersArr[i].MENGE = oRequestBody.TransfersArr[i].ERFMG;
                oRequestBody.TransfersArr[i].ERFME = oRequestBody.TransfersArr[i].MEINS;

                // if BWTAR isn't set, use the first one on the list
                if (!oRequestBody.TransfersArr[i].BWTAR) {
                    oRequestBody.TransfersArr[i].BWTAR = this.mValuation.getData()[0].CATEGORY;
                }
            }
            if (!bValid) {
                jQuery.sap.require("sap.m.MessageBox");
                sap.m.MessageBox.show(this.getText("ToastMessage.InvalidQuantity"), {
                    title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.error"),
                    icon: sap.m.MessageBox.Icon.ERROR,
                    actions: [
                        sap.m.MessageBox.Action.OK
                    ]
                });
                return;
            }

            var self = this;
            Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/inter_plant_transfer",
                method: "POST",
                data: JSON.stringify([ oRequestBody ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    jQuery.sap.require("sap.m.MessageBox");
                    sap.m.MessageBox.show(self.getText("ToastMessage.TransferSuccess"), {
                        title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.success"),
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        actions: [
                            sap.m.MessageBox.Action.OK
                        ],
                        onClose: function(sAction) {
                            self.mMaterials.setData([]);
                        }
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            }));
        },

        onCancel: function(oEvent) {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            this.mMaterials.setData([]);

            if (sPreviousHash) {
                window.history.go(-1);
            } else {
                Utilities.navHome();
            }
        },

        qtyValueStateFormatter: function(iERFMG, iQUANT) {
            var sValueState;
            if (!iERFMG || iERFMG < 1 || iERFMG > iQUANT) {
                sValueState = sap.ui.core.ValueState.Error;
            } else {
                sValueState = sap.ui.core.ValueState.None;
            }
            return sValueState;
        },

        qtyValueStateTextFormatter: function(iERFMG, iQUANT) {
            var sText;
            if (iERFMG === null || iERFMG === undefined) {
                sText = this.getText("ValueStateText.qtyEmpty");
            } else if (iERFMG < 1) {
                sText = this.getText("ValueStateText.qtyBelowMin");
            } else if (iERFMG > iQUANT) {
                sText = this.getText("ValueStateText.qtyExceedsOnHand");
            } else {
                sText = "";
            }
            return sText;
        }
    });
}(dep.fiori.lib.controller.ControllerBase, dep.fiori.lib.util.SelectMaterialDialog, dep.fiori.lib.util.Utilities));