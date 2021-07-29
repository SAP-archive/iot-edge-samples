jQuery.sap.require("dep.fiori.lib.util.SelectMaterialDialog");

(function(Utilities, DataAccess, SelectMaterialDialog) {
    sap.ui.controller("dep.fiori.planningdoc.app.detail", {
        onInit: function() {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

            this.mDoc = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mDoc);

            this.mState = new sap.ui.model.json.JSONModel({
                editing: false
            });
            this.getView().setModel(this.mState, "state");

            // Object to track which stock quantities are pending/fetched
            this.oOnhand = {};
        },

        onRouteMatched: function(oEvent) {
            if (oEvent.getParameter("name") === "detail") {
                var oNavArgs = oEvent.getParameter("arguments");
                this.sPLANDOC_ID = oNavArgs.PLANDOC_ID;
                this.refresh();
            }
        },

        onExit: function() {
            this.abortLazyLoading = true;
        },

        refresh: function() {
            var url = "/ws_restful_data_controller/pr_plan_doc?PLANDOC_ID=" + this.sPLANDOC_ID;

            var self = this;
            return Utilities.showBusyIndicator($.ajax(url).done(function(oResponseData) {
                // If there is no matching planning document an empty array will be returned
                if (Array.isArray(oResponseData) && oResponseData.length === 0) {
                    self.oRouter.navTo("list", {}, true);
                    return;
                }

                self.mDoc.setData(oResponseData);
                var aMaterials = [];
                for (var i = 0; i < oResponseData.items.length; i++) {
                    aMaterials.push({
                        MATNR: oResponseData.items[i].MATNR,
                        LGORT: oResponseData.items[i].LGORT
                    });
                }

                self.loadOnhand(aMaterials);
            }));
        },

        onAddItem: function(oEvent) {
            var self = this;
            SelectMaterialDialog.getMaterial().done(function(aMaterials) {
                if (aMaterials.length > 0) {
                    var oDoc = self.mDoc.getData();
                    var aItems = oDoc.items;
                    aItems.push.apply(aItems, aMaterials.map(function(oMaterial) {
                        return {
                            LINE_NUMBER: aItems.length + 1,
                            MATNR: oMaterial.MATNR,
                            PRQTY: 0
                        };
                    }));
    
                    self.onSave();
                }
            });
        },

        onRemoveItem: function(oEvent) {
            var oContext = oEvent.getParameter("listItem").getBindingContext();
            var oModel = oContext.getModel();
            var oMaterial = oModel.getProperty(oContext.getPath());

            var oDoc = oModel.getData();
            var aItems = oDoc.items;
            for (var i = aItems.length - 1; i >= 0; i--) {
                if (aItems[i] === oMaterial) {
                    aItems.splice(i, 1);
                    break;
                }
            }

            oModel.refresh();
            this.onSave();
        },

        loadOnhand: function(aMaterials) {
            // Abort the chain of requests, for example if we leave the app entirely
            if (this.abortLazyLoading) {
                delete this.abortLazyLoading;
                return;
            }

            if (aMaterials.length < 1) {
                return;
            }

            var oMaterial = aMaterials.shift();
            // Initialize object for storage location if it doesn't exist
            this.oOnhand[oMaterial.LGORT] = this.oOnhand[oMaterial.LGORT] || {};
            var oStorageLocation = this.oOnhand[oMaterial.LGORT];

            // Based on MATNR, LGORT, and ONHAND update the current model
            // This is used in multiple places below, so declare the function early
            var fnUpdateModel = function(oMaterial) {
                var oDoc = self.mDoc.getData();
                var aItems = oDoc.items;
                for (var i = 0; i < aItems.length; i++) {
                    if (aItems[i].MATNR === oMaterial.MATNR &&
                        aItems[i].LGORT === oMaterial.LGORT) {
                        self.mDoc.setProperty("/items/" + i + "/ONHAND", oMaterial.ONHAND);
                        break;
                    }
                }
            };

            var self = this;
            // If we've never tried this MANTR before or the previous fetch failed
            if (typeof(oStorageLocation[oMaterial.MATNR]) === "undefined" ||
                (oStorageLocation[oMaterial.MATNR] && oStorageLocation[oMaterial.MATNR].state() === "rejected")) {

                // Create a new promise to track status
                oStorageLocation[oMaterial.MATNR] = $.Deferred().done(fnUpdateModel).always(function() {
                    // Continue with next item whether we succeed or fail
                    if (aMaterials.length > 0) {
                        self.loadOnhand(aMaterials);
                    }
                });

                var sQuery = Utilities.getQueryString({
                    MATNR: oMaterial.MATNR,
                    LGORT: oMaterial.LGORT
                });

                var url = "/ws_restful_data_controller/component_onhand" + sQuery;
                $.ajax(url).done(function(oResponseData) {
                    if (Array.isArray(oResponseData)) {
                        oResponseData = oResponseData[0];
                    }

                    if (oResponseData.ErrorID) {
                        oStorageLocation[oMaterial.MATNR].reject();
                    } else {
                        // Provide the material to .done handlers (in this case fnUpdateModel)
                        oStorageLocation[oMaterial.MATNR].resolve({
                            MATNR: oMaterial.MATNR,
                            LGORT: oMaterial.LGORT,
                            ONHAND: oResponseData.STOCK_ON_HAND
                        });
                    }
                }).fail(function() {
                    oStorageLocation[oMaterial.MATNR].reject();
                });
            } else {
                // Update the model with the resolved promise's result
                oStorageLocation[oMaterial.MATNR].done(fnUpdateModel);
                // Continue for the next item
                if (aMaterials.length > 0) {
                    self.loadOnhand(aMaterials);
                }
            }
        },

        onEdit: function(oEvent) {
            this.mState.setProperty("/editing", true);
        },

        onCancel: function(oEvent) {
            this.mState.setProperty("/editing", false);
            this.refresh();
        },

        onSave: function(oEvent) {
            var oDoc = this.mDoc.getData();
            var aItems = oDoc.items;
            var aRequestItems = [];

            for (var i = 0; i < aItems.length; i++) {
                aRequestItems.push({
                    LINE_NUMBER: i + 1,
                    MATNR: aItems[i].MATNR,
                    PRQTY: aItems[i].PRQTY
                });
            }

            var oRequestData = {
                PLANDOC_ID: this.sPLANDOC_ID,
                DESCRIPTION: oDoc.DESCRIPTION,
                items: aRequestItems
            };

            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/pr_plan_doc",
                method: "PUT",
                data: JSON.stringify(oRequestData)
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    self.mState.setProperty("/editing", false);
                    sap.m.MessageToast.show(self.getText("ToastMessage.Success"));
                    self.refresh();
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            }));
        },

        createPR: function(oEvent) {
            var oDoc = this.mDoc.getData();
            var aItems = oDoc.items;

            var oRequestData = {
                TDTXT: "",
                PRItemArray: []
            };

            for (var i = aItems.length - 1; i >= 0; i--) {
                oRequestData.PRItemArray.push({
                    MATNR: aItems[i].MATNR,
                    TXZ01: aItems[i].MAKTX || "",
                    MENGE: aItems[i].REQQTY,
                    LFDAT: aItems[i].LFDAT || Utilities.date.currDateFormatted(),
                    BNFPO: String("00000" + (Number(i) + 1)).slice(-5),
                    IS_CHANGED: "I"
                });
            }

            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/purchase_requisitions",
                method: "POST",
                data: JSON.stringify([oRequestData]),
                headers: {
                    PLANDOC_ID: this.sPLANDOC_ID
                }
            })).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    self.mState.setProperty("/editing", false);

                    jQuery.sap.require("sap.m.MessageBox");
                    sap.m.MessageBox.show(self.getText("Dialog.success"), {
                        title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.success"),
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        actions: [
                            self.getText("Dialog.view"),
                            sap.m.MessageBox.Action.OK
                        ],
                        onClose: function(sAction) {
                            if (sAction === sap.m.MessageBox.Action.OK) {
                                self.refresh();
                            } else {
                                var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
                                oNavigationService.toExternal({
                                    target: {
                                        shellHash: "#depPurchasereq-display&/" + oResponseData.OBJECT_KEY
                                    }
                                });
                            }
                        }
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            });
        },

        cloneDoc: function(oEvent) {
            var oDoc = this.mDoc.getData();
            var aItems = oDoc.items;
            var aRequestItems = [];

            for (var i = 0; i < aItems.length; i++) {
                aRequestItems.push({
                    LINE_NUMBER: aItems[i].LINE_NUMBER,
                    MATNR: aItems[i].MATNR,
                    PRQTY: aItems[i].PRQTY
                });
            }

            var oRequestData = {
                MRP_NUMBER: oDoc.MRP_NUMBER,
                DESCRIPTION: this.getText("Clone.copyOf", [oDoc.PLANDOC_ID]),
                items: aRequestItems
            };

            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/pr_plan_doc",
                method: "POST",
                data: JSON.stringify(oRequestData)
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.CloneSuccess"));
                    self.oRouter.navTo("detail", {
                        PLANDOC_ID: oResponseData.OBJECT_KEY
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            }));
        },

        toPR: function(oEvent) {
            var sPR_NO_LOCAL = oEvent.getSource().getText();
            var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
            oNavigationService.toExternal({
                target: {
                    shellHash: "#depPurchasereq-display&/" + sPR_NO_LOCAL
                }
            });
        },

        getText: function(sKey, aArgs) {
            this.oI18n = this.oI18n || this.getView().getModel("i18n").getResourceBundle();
            if (this.oI18n) {
                return this.oI18n.getText(sKey, aArgs);
            }
            return "";
        }
    });
}(dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.SelectMaterialDialog));