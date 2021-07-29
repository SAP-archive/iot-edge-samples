jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.extenderconfig.app.setup", {
        onInit: function() {
            this.setKey("DATA_PROVIDER");
            this.setDetailRoute("setup");
            DetailControllerBase.prototype.onInit.apply(this, arguments);

            this.mDataProvider = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mDataProvider);

            this.mServices = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mServices, "services");
            
            this.mKey = this.getView().getModel(this.getKey());
        },

        loadData: function(sModelId) {
            var aPromises = [];

            var self = this;
            aPromises.push($.ajax("/ws_req_fwd_restful/dataprovider?ID=" + sModelId).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.mDataProvider.setData(oResponseData);
            }));

            aPromises.push($.ajax("/ws_req_fwd_restful/dataservice?DATA_PROVIDER=" + sModelId).done(function(aResponseData) {
                self.mServices.setData(aResponseData);
            }));

            Utilities.showBusyIndicator($.when.apply(this, aPromises));
        },

        onSaveProvider: function(oEvent) {
            var oDataProvider = this.mDataProvider.getData();
            var oRequestData = {
                ID: oDataProvider.ID,
                DOMAIN_URL: oDataProvider.DOMAIN_URL,
                HTTP_PROXY: oDataProvider.HTTP_PROXY || '',
                CERTIFICATE: oDataProvider.CERTIFICATE || ''
            };

            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: '/ws_req_fwd_restful/dataprovider',
                method: 'PUT',
                data: JSON.stringify(oRequestData)
            }).done(function(aResponseData) {
                if (aResponseData.length && aResponseData[0].ErrorMsg) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.Error", [ aResponseData[0].ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.ProviderSaveSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            }));
        },

        onListItemSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("services");
            var oService = oContext.getModel().getProperty(oContext.getPath());

            var oDialog = this.getEditDialog();
            oDialog.getModel().setData(oService);
            oDialog.getModel("mode").setData("edit");
            if (!oDialog.isOpen()) {
                oDialog.open();
            }
        },

        onCreate: function(oEvent) {
            var oDialog = this.getEditDialog();
            oDialog.getModel().setData({
                SIGNATURE: "",
                SERVICE_URL: ""
            });

            oDialog.getModel("mode").setData("create");
            if (!oDialog.isOpen()) {
                oDialog.open();
            }
        },

        getEditDialog: function(oEvent) {
            if (!this.oEditDialog) {
                this.oEditDialog = sap.ui.xmlfragment("dep.fiori.extenderconfig.app.setupServiceEdit", this);
                this.getView().addDependent(this.oEditDialog);
                this.oEditDialog.setModel(new sap.ui.model.json.JSONModel());
                this.oEditDialog.setModel(new sap.ui.model.json.JSONModel(), "mode");
            }
            return this.oEditDialog;
        },

        onEditDialogClose: function(oEvent) {
            this.loadData(this.mKey.getData());
            this.getEditDialog().getModel().setData({});
        },

        closeEditDialog: function(oEvent) {
            var oDialog = this.getEditDialog();
            if (oDialog.isOpen()) {
                oDialog.close();
            }
        },

        onSaveService: function(oEvent) {
            var oDialog = this.getEditDialog();
            var oService = oDialog.getModel().getData();

            var sMode = oDialog.getModel("mode").getData();
            if (sMode === "edit") {
                this.saveService(oService, "PUT");
            } else {
                this.saveService(oService, "POST");
            }
        },

        saveService: function(oService, sMethod) {
            var oRequestData = {
                DATA_PROVIDER: this.mKey.getData(),
                SIGNATURE: oService.SIGNATURE,
                SERVICE_URL: oService.SERVICE_URL
            };

            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_req_fwd_restful/dataservice",
                method: sMethod,
                data: JSON.stringify(oRequestData)
            }).done(function(aResponseData) {
                if (aResponseData.length && aResponseData[0].ErrorMsg) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ aResponseData[0].ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("ToastMessage.ServiceSaveSuccess"));
                    self.closeEditDialog();
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            }));
        },

        onSetUser: function(oEvent) {
            var oDialog = this.getUserDialog();
            if (!oDialog.isOpen()) {
                oDialog.open();
            }
        },

        getUserDialog: function() {
            if (!this.oUserDialog) {
                this.oUserDialog = sap.ui.xmlfragment("dep.fiori.extenderconfig.app.setupTechnicalUser", this);
                this.getView().addDependent(this.oUserDialog);
                this.oUserDialog.setModel(new sap.ui.model.json.JSONModel());
            }
            return this.oUserDialog;
        },

        onUserDialogClose: function(oEvent) {
            this.getUserDialog().getModel().setData({});
        },

        closeUserDialog: function(oEvent) {
            var oDialog = this.getUserDialog();
            if (oDialog.isOpen()) {
                oDialog.close();
            }
        },

        onSaveUser: function(oEvent) {
            var oDialog = this.getUserDialog();
            var oUser = oDialog.getModel().getData();
            var sDataProvider = this.mKey.getData();

            if (oUser.user && oUser.auth) {
                var self = this;
                Utilities.showBusyIndicator($.ajax({
                    url: "/ws_req_fwd_restful/technical_user?DATA_PROVIDER=" + sDataProvider,
                    headers: {
                        Authorization: "Basic " + btoa( oUser.user + ":" + oUser.auth )
                    }
                }).done(function(aResponseData) {
                    if (aResponseData.length && aResponseData[0].ErrorMsg) {
                        sap.m.MessageToast.show(self.getText("ToastMessage.CloudAuthError"));
                    } else {
                        sap.m.MessageToast.show(self.getText("ToastMessage.UserSaveSuccess"));
                        self.closeUserDialog();
                    }
                }).fail(function() {
                    sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                }));
            }
        },

        onUserChange: function(oEvent) {
            var oDialog = this.getUserDialog();
            if (oEvent.getParameter("value") && oDialog.getModel().getProperty("/auth")) {
                oDialog.getModel().setProperty("/canSave", true);
            } else {
                oDialog.getModel().setProperty("/canSave", false);
            }
        },

        onAuthChange: function(oEvent) {
            var oDialog = this.getUserDialog();
            if (oEvent.getParameter("value") && oDialog.getModel().getProperty("/user")) {
                oDialog.getModel().setProperty("/canSave", true);
            } else {
                oDialog.getModel().setProperty("/canSave", false);
            }
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));