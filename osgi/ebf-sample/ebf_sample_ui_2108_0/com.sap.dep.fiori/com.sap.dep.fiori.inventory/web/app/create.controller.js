jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.SelectMaterialDialog");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(CreateControllerBase, Utilities, SelectMaterialDialog) {
    CreateControllerBase.extend("dep.fiori.inventory.app.create", {
        onInit: function() {
            this.setListRoute("list");
            CreateControllerBase.prototype.onInit.apply(this, arguments);

            this.mMaterials = new sap.ui.model.json.JSONModel([]);
            this.getView().setModel(this.mMaterials);

            this.mLocation = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mLocation, "location");

            this.mBinRange = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mBinRange, "bin");

            this.mCreateMode = new sap.ui.model.json.JSONModel({
                create: "materialList"
            });
            this.getView().setModel(this.mCreateMode, "mode");

            this.mLookup = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mLookup, "lookup");

            var self = this;
            $.ajax("/ws_restful_data_controller/storage_location").done(function(aResponseData) {
                self.mLookup.setProperty("/location", aResponseData);
            });
        },

        onRouteMatched: function(oEvent) {
            if (oEvent.getParameter("name") === "create") {
                var oArgs = oEvent.getParameter("arguments");

                this.mLocation.setProperty("/previous", this.mLocation.getProperty("/current"));
                this.mLocation.setProperty("/current", oArgs.LGORT);
                this.loadBinList();
            }
        },

        loadBinList: function() {
            var sLGORT = this.mLocation.getProperty("/current");
            var sMode = this.mCreateMode.getProperty("/create");

            if (sLGORT && sMode === "binRange") {
                if (sLGORT !== this.mLocation.getProperty("/previous")) {
                    var self = this;
                    Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/physical_inventory_bin?LGORT=" + sLGORT).done(function(aResponseData) {
                        self.mLookup.setProperty("/bin", aResponseData);
                    }));
                }
            } else {
                this.mLookup.setProperty("/bin", []);
            }
        },

        onSelectLocation: function(oEvent) {
            var sCurrentLocation = this.mLocation.getProperty("/current");
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var sNewLocation = oSelectedItem.getKey();
            if (sCurrentLocation &&
                sCurrentLocation !== sNewLocation &&
                this.mMaterials.getData().length > 0) {

                var self = this;
                jQuery.sap.require("sap.m.MessageBox");
                sap.m.MessageBox.show(this.getText("Location.change"), {
                    title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.warning"),
                    icon: sap.m.MessageBox.Icon.WARNING,
                    actions: [
                        sap.m.MessageBox.Action.OK,
                        sap.m.MessageBox.Action.CANCEL
                    ],
                    onClose: function(sAction) {
                        if (sAction === "OK") {
                            self.mMaterials.setData([]);
                            self.getRouter().navTo("create", {
                                LGORT: sNewLocation
                            }, true);
                        } else {
                            // On cancel, reset dropdown to current location
                            self.mLocation.refresh(true);
                        }
                    }
                });
            } else {
                this.getRouter().navTo("create", {
                    LGORT: sNewLocation
                }, true);
            }
        },

        onSelectMode: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            this.mCreateMode.setProperty("/create", oSelectedItem.getKey());
            this.mMaterials.setData([]);
            this.loadBinList();
        },

        onAddMaterial: function(oEvent) {
            var self = this;
            SelectMaterialDialog.getMaterial("/Physical_Inventory_Materials", {
                LGORT: { values: [this.mLocation.getProperty("/current")] }
            }).done(function(aNewMaterials) {
                var aMaterials = self.mMaterials.getData();
                aMaterials.push.apply(aMaterials, aNewMaterials);
                self.mMaterials.refresh();
            });
        },

        onRemoveMaterial: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var sIndex = oListItem.getBindingContext().getPath().substring(1);
            var aMaterials = this.mMaterials.getData();
            aMaterials.splice(sIndex, 1);
            this.mMaterials.refresh();
        },

        onLoadBinRange: function(oEvent) {
            var oRange = {
                LGORT: this.mLocation.getProperty("/current"),
                LGPBE_start: this.mBinRange.getProperty("/start")
            };

            var sEnd = this.mBinRange.getProperty("/end");
            if (sEnd && sEnd !== " ") {
                oRange.LGPBE_end = sEnd;
            }

            if (oRange.LGORT && oRange.LGPBE_start && oRange.LGPBE_start !== " ") {
                var sQuery = Utilities.getQueryString(oRange);
                var self = this;
                Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/physical_inventory_bin" + sQuery).done(function(aResponseData) {
                    self.mMaterials.setData(aResponseData)
                }));
            }
        },

        onSaveDocument: function(oEvent) {
            var aMaterials = this.mMaterials.getData();
            var sLGORT = this.mLocation.getProperty("/current");
            var sGJAHR = new Date().getFullYear();

            for (var i = 0; i < aMaterials.length; i++) {
                delete aMaterials[i].__metadata;
                aMaterials[i] = Object.assign({
                    ERFMG: 0,
                    LGORT: sLGORT,
                    GJAHR: sGJAHR,
                    IS_CHANGED: "I",
                    ZEILI: i + 1
                }, aMaterials[i]);
            }

            var oRequestData = {
                LGORT: sLGORT,
                BLDAT: Utilities.date.currDateFormatted(),
                GJAHR: sGJAHR,
                PIDocItemArray: aMaterials
            };

            var self = this;
            Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/physical_inventory_documents",
                method: "POST",
                data: JSON.stringify([ oRequestData ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.CreateDocSuccess"), {
                        closeOnBrowserNavigation: false
                    });
                    self.mMaterials.setData([]);
                    self.getRouter().navTo("detail", {
                        INV_NO_LOCAL: oResponseData.OBJECT_KEY,
                        LGORT: sLGORT,
                        GJAHR: sGJAHR
                    }, true);
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            }));
        },
        
        resetModelData: function() {
            this.mMaterials.setData([]);
        }
    });
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.SelectMaterialDialog));