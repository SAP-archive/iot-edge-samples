jQuery.sap.require("dep.fiori.lib.util.SelectMaterialDialog");

sap.ui.controller("dep.fiori.bom.app.main", {
    onInit: function() {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

        this.mOData = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");
        this.getView().setModel(this.mOData, "odata");

        this.mBOM = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.mBOM);

        this.mComponents = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.mComponents, "components");

        this.oSplitApp = this.getView().byId("content");
    },

    onRouteMatched: function(oEvent) {
        this.sEQUNR = oEvent.getParameters().arguments.EQUNR;

        if (!this.sEQUNR) {
            this.mBOM.setData({});
            this.mComponents.setData({});
            // Force mobile page transition if necessary
            this.oSplitApp.toMaster(this.oSplitApp.getInitialMaster());
            return;
        }

        var self = this;
        this.mOData.read("/Equipment_BOM", {
            filters: [
                new sap.ui.model.Filter(
                    "EQUNR",
                    sap.ui.model.FilterOperator.EQ,
                    this.sEQUNR
                )
            ],
            success: function(oResponseData) {
                self.mBOM.setData(oResponseData.results[0]);
            }
        });

        return $.ajax({
            url: "/ws_restful_data_controller/equipment_bom",
            headers: {
                EQUNR: this.sEQUNR
            }
        }).done(function(oResponseData) {
            self.mComponents.setData(oResponseData);
            // Force mobile page transition if necessary
            self.oSplitApp.toDetail(self.oSplitApp.getInitialDetail());
        });
    },

    onSearch: function(oEvent) {
        var sQuery = oEvent.getParameter("query");

        var oFilters = new sap.ui.model.Filter({
            filters: [
                new sap.ui.model.Filter(
                    "BOM_NUM",
                    sap.ui.model.FilterOperator.EQ,
                    sQuery
                ),
                new sap.ui.model.Filter(
                    "EQUNR_LIST",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                )
            ],
            and: false
        });

        var oList = this.getView().byId("bom-list");
        oList.getBinding("items").filter(oFilters);
    },

    onListItemPress: function(oEvent) {
        var sId = oEvent.getParameter("listItem").data("navTo");
        this.oRouter.navTo("detail", { EQUNR: sId });
    },

    onAddComponent: function(oEvent) {
        var self = this;
        dep.fiori.lib.util.SelectMaterialDialog.getMaterial().done(function(aMaterials) {
            self.addComponentToBOM(aMaterials);
        });
    },

    addComponentToBOM: function(aMaterials) {
        if (aMaterials.length > 0) {
            var oBOM = this.mBOM.getData();
            var aRequestData = aMaterials.map(function(oMaterial) {
                return {
                    MAKTX: oMaterial.MAKTX,
                    MEINS: oMaterial.MEINS,
                    MFRPN: oMaterial.MFRPN,
                    MFRNR: oMaterial.MFRNR,
                    IDNRK: oMaterial.MATNR,
                    EQUNR: oBOM.EQUNR,
                    MATNR: oBOM.BOM_NUM,
                    STLAN: oBOM.STLAN,
                    STLTY: oBOM.STLTY,
                    STLNR: oBOM.STLNR,
                    STLAL: oBOM.STLAL,
                    MENGE: "1.0"
                };
            });
    
            var mI18n = this.getView().getModel("i18n").getResourceBundle();
    
            var self = this;
            return dep.fiori.lib.util.Utilities.showBusyIndicator(
                this.saveNewComponent(aRequestData).done(function(oResponseData) {
                    oResponseData = oResponseData[0];
                    if (oResponseData && oResponseData.STATUS === "200") {
                        // Force model refresh
                        var oSuccessEvent = new sap.ui.base.Event(null, null, {
                            arguments: { EQUNR: self.sEQUNR }
                        });
                        self.onRouteMatched(oSuccessEvent).always(function() {
                            sap.m.MessageToast.show(mI18n.getText("ToastMessage.AddSuccess"));
                        });
                    } else {
                        sap.m.MessageToast.show(mI18n.getText("ToastMessage.Error", [ oResponseData.ErrorMsg ]));
                    }
                }).fail(function() {
                    sap.m.MessageToast.show(mI18n.getText("ToastMessage.CommunicationError"));
                })
            );
        }
    },

    saveNewComponent: function(aRequestData) {
        return $.ajax({
            url: "/ws_restful_data_controller/equipment_bom",
            method: "POST",
            data: JSON.stringify(aRequestData)
        });
    },

    onDelete: function(oEvent) {
        var sPath = oEvent.getParameter("listItem").getBindingContextPath("components");
        var oComponent = this.mComponents.getProperty(sPath);
        var mI18n = this.getView().getModel("i18n").getResourceBundle();

        var self = this;
        return dep.fiori.lib.util.Utilities.showBusyIndicator(
            this.deleteComponent(this.sEQUNR, oComponent.STLKN).done(function(oResponseData) {
                oResponseData = oResponseData[0];
                if (oResponseData && oResponseData.STATUS === "200") {
                    // Force model refresh
                    var oSuccessEvent = new sap.ui.base.Event(null, null, {
                        arguments: { EQUNR: self.sEQUNR }
                    });
                    self.onRouteMatched(oSuccessEvent).always(function() {
                        sap.m.MessageToast.show(mI18n.getText("ToastMessage.DeleteSuccess"));
                    });
                } else {
                    sap.m.MessageToast.show(mI18n.getText("ToastMessage.Error", [ oResponseData.ErrorMsg ]));
                }
            }).fail(function() {
                sap.m.MessageToast.show(mI18n.getText("ToastMessage.CommunicationError"));
            })
        );
    },

    deleteComponent: function(sEQUNR, sSTLKN) {
        return $.ajax({
            url: "/ws_restful_data_controller/equipment_bom",
            method: "DELETE",
            headers: {
                EQUNR: sEQUNR,
                STLKN: sSTLKN
            }
        });
    },

    detailVisibleFormatter: function(oBOM) {
        if (oBOM && oBOM.BOM_NUM) {
            return true;
        }
        return false;
    },

    listTitleFormatter: function(iCount) {
        var mI18n = this.getView().getModel("i18n");
        if (mI18n) {
            return mI18n.getResourceBundle().getText("Table.count", [ iCount ]);
        }
        return null;
    },

    handleResponsivePopoverPress: function(oEvent) {
        jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
        var aTransactions = this.mBOM.getProperty("/EDGE_ERRORS").split(',');
        dep.fiori.lib.util.ErrorPopover.openBy(oEvent.getSource(), aTransactions);
    }
});