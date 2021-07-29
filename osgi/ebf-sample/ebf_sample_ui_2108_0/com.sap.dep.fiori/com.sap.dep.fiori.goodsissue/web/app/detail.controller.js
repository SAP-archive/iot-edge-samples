jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.goodsissue.app.detail", {

        onInit: function() {
            this.setKey("AUFNR");
            this.setListRoute("list");
            DetailControllerBase.prototype.onInit.apply(this, arguments);

            this.mWorkorder = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mWorkorder, "workorder");

            this.mComponents = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mComponents, "components");

            this.mStorageLocation = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mStorageLocation, "selectedLocation");

            var self = this;
            this.oLookupPromise = $.ajax("/ws_restful_data_controller/storage_location").done(function(oResponseData) {
                self.getView().setModel(new sap.ui.model.json.JSONModel(oResponseData), "locations");
                self.mStorageLocation.setProperty("/LGORT", oResponseData[0].LGORT);
                self.refresh();
            });
        },

        loadData: function(sAUFNR) {
            this.sAUFNR = sAUFNR;

            this.mWorkorder.setData({});
            this.mComponents.setData([]);
            this.loadWorkorder(this.sAUFNR);

            var self = this;
            this.oLookupPromise.done(function() {
                var sLGORT = self.mStorageLocation.getProperty("/LGORT");
                if (sLGORT) {
                    self.loadComponents(self.sAUFNR, sLGORT);
                }
            });
        },

        loadWorkorder: function(sAUFNR) {
            var self = this;
            return $.ajax("/ws_restful_data_controller/workorder?AUFNR=" + sAUFNR).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.mWorkorder.setData(oResponseData);
            });
        },

        onIssueGoods: function(oEvent) {
            var oRequestBody = this.mWorkorder.getData();
            oRequestBody.GoodsToIssueArr = [];

            var oNow = new Date();
            var sDate = oNow.getFullYear() + ("0" + (oNow.getMonth() + 1)).slice(-2) + ("0" + oNow.getDate()).slice(-2);

            Object.assign(oRequestBody, {
                BLDAT: sDate,
                BUDAT: sDate,
                MJAHR: oNow.getFullYear()
            });

            var bInvalid = false;

            var aComponents = this.mComponents.getData();
            for (var i = 0; i < aComponents.length; i++) {
                if (aComponents[i].ERFMG > 0) {
                    this.validateComponent(aComponents[i]);
                    if (aComponents[i].error) {
                        bInvalid = true;
                    } else {
                        Object.assign(aComponents[i], {
                            MENGE: aComponents[i].ERFMG,
                            ERFME: aComponents[i].MEINS,
                            BWART: "261",
                            CUD_IND: "C"
                        });
                        oRequestBody.GoodsToIssueArr.push(aComponents[i]);
                    }
                }
            }

            if (bInvalid) {
                sap.m.MessageToast.show(this.getText("Error.invalid"));
                return;
            }

            var aRequestBody = [ oRequestBody ];

            if (oRequestBody.GoodsToIssueArr.length) {
                var self = this;
                dep.fiori.lib.util.Utilities.showBusyIndicator($.ajax({
                    url: "/ws_restful_data_controller/workorder_goods_issues",
                    method: "POST",
                    data: JSON.stringify(aRequestBody)
                }).done(function(oResponseData) {
                    if (Array.isArray(oResponseData)) {
                        oResponseData = oResponseData[0];
                    }

                    if (oResponseData.ErrorID) {
                        sap.m.MessageToast.show(self.getText("Error.other", oResponseData.ErrorMsg));
                    } else {
                        sap.m.MessageToast.show(self.getText("Save.success"));
                        self.loadComponents(self.sAUFNR, self.mStorageLocation.getProperty("/LGORT"));
                    }
                }).fail(function() {
                    sap.m.MessageToast.show(self.getText("Error.save"));
                }));
            }
        },

        onLocationChange: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var sNewLocation = oSelectedItem.getKey();
            this.loadComponents(this.sAUFNR, sNewLocation);
        },

        onQuantityChange: function(oEvent) {
            var oBinding = oEvent.getSource().getBindingContext("components");
            var oModel = oBinding.getModel();
            var oComponent = oModel.getProperty(oBinding.getPath());

            this.validateComponent(oComponent);

            oModel.refresh();
        },

        validateComponent: function(oComponent) {
            if (Number(oComponent.ERFMG) !== Math.floor(oComponent.ERFMG)) {
                oComponent.error = this.getText("Invalid.decimal");
            } else if (oComponent.ERFMG > oComponent.QUANT) {
                oComponent.error = this.getText("Invalid.insufficientStock");
            } else if (Number(oComponent.ERFMG) + Number(oComponent.ENMNG) > oComponent.BDMNG) {
                oComponent.error = this.getText("Invalid.overIssue");
            } else {
                delete oComponent.error;
            }
        },

        refresh: function(oEvent) {
            this.mComponents.setData([]);
            this.loadComponents(this.sAUFNR, this.mStorageLocation.getProperty("/LGORT"));
        },

        loadComponents: function(sAUFNR, sLGORT) {
            var self = this;
            return dep.fiori.lib.util.Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/workorder_components?AUFNR=" + sAUFNR + "&LGORT=" + sLGORT).done(function(oResponseData) {
                self.mComponents.setData(oResponseData);
            }));
        },

        valueStateFormatter: function(sError) {
            if (sError) {
                return sap.ui.core.ValueState.Error;
            }
            return sap.ui.core.ValueState.None;
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));