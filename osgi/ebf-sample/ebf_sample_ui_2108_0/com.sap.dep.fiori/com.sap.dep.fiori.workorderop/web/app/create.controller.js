jQuery.sap.require("dep.fiori.lib.util.DataAccess");

sap.ui.controller("dep.fiori.workorderop.app.create", {

    onInit: function () {
        this.setRouter(sap.ui.core.UIComponent.getRouterFor(this));
        this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
    },

    //this logic is to take the user back to the edit operation page if they happen to reload the page (to prevent adding operation to non-existant model)
    //also initiates loadOperation and gets the operationsList model when all conditions are successful
    onRouteMatched: function (oEvent) {
        this.workorderOperation = null;
        this.getView().byId("opcControlKeySelect").setValueState("None");
        this.getView().byId("opcWorkcenterSelect").setValueState("None");

        if (oEvent.getParameter("name") === "create" || oEvent.getParameter("name") === "operation") {
            var editView = sap.ui.getCore().byId("dep-fiori-workorderop-detail");
            this.aufnr = oEvent.getParameters().arguments.AUFNR; //entire controller can then use this
            if (!editView) {

                this.getRouter().navTo("detail", {
                    AUFNR: this.aufnr
                });
            } else {
                this.operationsListModel = editView.getModel(); //entire controller can then use this
                this.workorderModel = editView.getModel("workorder"); //entire controller can then use this
                if (!this.operationsListModel || !this.workorderModel) {
                    this.getRouter().navTo("detail", {
                        AUFNR: this.aufnr
                    });
                } else {
                    this.loadOperation();
                }
            }
        }
    },

    changeState: function (oEvent) {
        sap.ushell.Container.setDirtyFlag(true);
    },

    changeValueState: function (oEvent) {
        oEvent.getSource().setValueState("None");
    },

    loadOperation: function () { //this acts like init
        this.odataModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");
        this.getView().setModel(this.odataModel, "odata");

        //create error message handler
        this.oMessageTemplate = new sap.m.MessagePopoverItem({
            title: {
                path: "TITLE"
            },
            subtitle: {
                path: "SUBTITLE"
            }
        });

        this.oMessagePopover = new sap.m.MessagePopover({
            items: {
                path: "/",
                template: this.oMessageTemplate
            },
            initiallyExpanded: true
        });

        this.mErrors = new sap.ui.model.json.JSONModel();
        this.mErrors.setData([]);

        this.oMessagePopover.setModel(this.mErrors);
        this.oMessagesButton = this.getView().byId("messages-button");
        this.oMessagesButton.setModel(this.mErrors);

        this.getView().byId("opcWorkcenterSelect").attachChange(this.changeValueState, this);
        this.getView().byId("opcControlKeySelect").attachChange(this.changeValueState, this);

        var self = this;
        $.ajax({
            url: "/saapconfig/WOAllowDupOperation",
            method: "GET"
        }).done(function (oResponseData, errorText, errorThrown) {
            self.bAllowDupOperation = (oResponseData === "Y") ? true : false;
        });

        this.workorderOperation = new sap.ui.model.json.JSONModel({
            "AUFNR": this.aufnr,
            "LTXA1": "",
            "VORNR": "", //will be set below
            "ARBPL": "",
            "STEUS": "",
            "WERKS": this.workorderModel.getProperty("/WERKS"),
            "ISMNW": "",
            "ARBEI": "",
            "DAUNO": "",
            "PREIS": "",
            "WAERS": "",
            "EBELN": "",
            "AUART": "",
            "WO_OPNOTE_LTXT": ""
        });

        this.i18n = this.getView().getModel("i18n");
        this.i18nGlobal = this.getView().getModel("i18nGlobal");

        //none of this will ever fail as the only way to get to this ui would be from workorder edit

        //borrow combo box model from edit controller
        this.comboBoxModel = sap.ui.getCore().byId("dep-fiori-workorderop-detail").getModel("COMBO_BOX_MODEL");
        this.getView().setModel(this.comboBoxModel, "COMBO_BOX_MODEL");

        //distinguishes between navigation from clicking an operation versus adding a new one
        this.selectedOperation = new sap.ui.model.json.JSONModel();
        this.selectedOperation.setData($.extend({}, sap.ui.getCore().byId("dep-fiori-workorderop-detail").getModel("SELECTED_OPERATION").getData()));
        if (this.selectedOperation.getData() && Object.keys(this.selectedOperation.getData()).length > 0) {
            this.addNewOperation = false; //we are editing an operation
            this.workorderOperation.setData(this.selectedOperation.getData());
            this.getView().byId("add-button").setText(this.i18nGlobal.getProperty("General.save"));
            if (this.workorderOperation.getProperty("/VORNR").indexOf("P") > -1) {
                this.getView().byId("objectPageTitle").setObjectTitle(this.i18n.getProperty("Page.editNewOperation") + ":");
                this.getView().byId("objectPageTitle").setObjectSubtitle();
            } else {
                this.getView().byId("objectPageTitle").setObjectTitle(this.i18n.getProperty("Page.editOperation") + ":");
                this.getView().byId("objectPageTitle").setObjectSubtitle(this.workorderOperation.getProperty("/VORNR"));
            }
        } else { //default
            this.addNewOperation = true;
            this.getView().byId("add-button").setText(this.i18nGlobal.getProperty("General.add"));
            this.getView().byId("objectPageTitle").setObjectTitle(this.i18n.getProperty("Page.createOperation") + ":");
            this.getView().byId("objectPageTitle").setObjectSubtitle();
            //this is for editing the correct pending vornr but still sending in a nvarchar (4) string to the backend (which isin't actually used but needs to be present)
            if (!this.distinguisher) {
                this.distinguisher = 0;
            }
            this.workorderOperation.setProperty("/VORNR", "P" + this.distinguisherFormatter(this.distinguisher));
        }
        this.getView().setModel(this.workorderOperation, "operation");
        this.workorderOperation.attachPropertyChange(this.changeState, this);

        if (this.workorderOperation.getProperty("/STEUS") === "EXT2") {
            this.getView().byId("noLimitCheckboxFormElement").setVisible(true);
            this.getView().byId("longTextButtonFormElement").setVisible(true);
            this.getView().byId("estValFormElement").setVisible(true);
        } else {
            this.getView().byId("noLimitCheckboxFormElement").setVisible(false);
            this.getView().byId("longTextButtonFormElement").setVisible(false);
            this.getView().byId("estValFormElement").setVisible(false);
        }

        //there is already long text so make the long text icon set to edit
        if (this.workorderOperation.getProperty("/WO_OPNOTE_LTXT").length && this.workorderOperation.getProperty("/WO_OPNOTE_LTXT")) {
            this.getView().byId("longTextButton").setIcon("sap-icon://document-text");
        } else {
            this.getView().byId("longTextButton").setIcon("sap-icon://add-document"); //set back to default icon
        }
    },


    longTextOpen: function () {
        if (!this.dialog) {
            this.dialog = sap.ui.xmlfragment("dep.fiori.workorderop.app.longtext", this);
            this.getView().addDependent(this.dialog);
        }
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.dialog);
        this.prevLTXT = this.workorderOperation.getProperty("/WO_OPNOTE_LTXT"); //ltxt is bound and cancelling or closing the dialog will revert ltxt back to normal
        this.dialog.open();
    },

    longTextSave: function () {
        if (this.workorderOperation.getProperty("/WO_OPNOTE_LTXT").length && this.workorderOperation.getProperty("/WO_OPNOTE_LTXT")) {
            this.getView().byId("longTextButton").setIcon("sap-icon://document-text");
        } else {
            this.getView().byId("longTextButton").setIcon("sap-icon://add-document");
        }
        this.dialog.destroy();
        this.dialog = null;
    },

    longTextCancel: function () {
        this.workorderOperation.setProperty("/WO_OPNOTE_LTXT", this.prevLTXT);
        this.dialog.destroy();
        this.dialog = null;
    },

    longTextEscape: function () {
        this.workorderOperation.setProperty("/WO_OPNOTE_LTXT", this.prevLTXT);
        this.dialog.destroy();
        this.dialog = null;
    },

    saveOperation: function () {
        var workorderOperationBackup = this.workorderOperation.getData();
        if (!this.validate()) {
            sap.m.MessageToast.show(this.mErrors.getProperty("/0/SUBTITLE"));
            return;
        }
        sap.ushell.Container.setDirtyFlag(false);

        var self = this;
        $.ajax({
            url: "/ws_restful_data_controller/wo_operation_duplicate",
            method: "POST",
            data: this.workorderOperation.getJSON()
        }).done(function (oResponseData, errorText, errorThrown) {
            var i18n = self.i18n;
            var objkey = oResponseData[0].OBJKEY;

            if (self.addNewOperation) { //we are adding a new operation
                if (objkey) {
                    // conflict with an existing operation
                    sap.m.MessageToast.show(i18n.getProperty("Error.ERR3"));

                    self.mErrors.getData().push({
                        TITLE: self.i18nGlobal.getProperty("General.error"),
                        SUBTITLE: i18n.getProperty("Error.ERR3")
                    });
                    self.mErrors.refresh();
                    return;
                } else {
                    //no match, or duplicates allowed
                    self.operationsListModel.getData().push(workorderOperationBackup);
                }
            } else {
                //we are editing an existing operation
                var aufnr = workorderOperationBackup.AUFNR;
                var vornr = workorderOperationBackup.VORNR;
                if (!objkey || objkey === aufnr + "" + vornr) {
                    //no conflict, or matches the current operation
                    for (var x = 0; x < self.operationsListModel.getData().length; x++) {
                        if (self.operationsListModel.getProperty("/" + x + "/VORNR") === vornr) {
                            self.operationsListModel.setProperty("/" + x, workorderOperationBackup);
                        }
                    }
                } else {
                    // conflict with an existing operation
                    sap.m.MessageToast.show(i18n.getProperty("Error.ERR3"));
                    return;
                }
            }
            self.operationsListModel.refresh();
            self.distinguisher = self.distinguisher + 1; //next distinguisher will be 1 greater
            sap.m.MessageToast.show(self.i18n.getProperty("List.operation") + " " + i18n.getProperty("Success.MSG3"), {
                closeOnBrowserNavigation: false
            });
            self.getRouter().navTo("detail", {
                AUFNR: self.aufnr
            });
        });
    },

    cancel: function () {
        var oHistory = sap.ui.core.routing.History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash) {
            window.history.go(-1);
        } else {
            this.oRouter.navTo("detail", {
                AUFNR: this.aufnr
            }, true);
        }
    },

    getRouter: function () {
        return this.oRouter;
    },

    setRouter: function (oRouter) {
        this.oRouter = oRouter;
    },

    handleMessagePopoverPress: function (oEvent) {
        this.oMessagePopover.toggle(oEvent.getSource());
    },

    validate: function () {
        var flag = true;
        this.mErrors.setData([]);
        var aErrors = this.mErrors.getData();

        this.getView().byId("opcWorkcenterSelect").setValueState("None");
        this.getView().byId("opcControlKeySelect").setValueState("None");
        this.getView().byId("txtLTXA1").setValueState("None");

        var workcenter = this.workorderOperation.getProperty("/ARBPL");
        var controlKey = this.workorderOperation.getProperty("/STEUS");

        if (!(workcenter && controlKey)) {
            aErrors.push({
                TITLE: this.i18nGlobal.getProperty("General.error"),
                SUBTITLE: this.i18n.getProperty("Error.ERR2")
            });
            flag = false;

            if (!workcenter) {
                this.getView().byId("opcWorkcenterSelect").setValueState("Error");
            }
            if (!controlKey) {
                this.getView().byId("opcControlKeySelect").setValueState("Error");
            }
        }

        if (!this.bAllowDupOperation) {
            for (var x = 0; x < this.operationsListModel.getData().length; x++) {
                if (this.operationsListModel.getProperty("/" + x + "/LTXA1") === this.workorderOperation.getProperty("/LTXA1") &&
                    this.operationsListModel.getProperty("/" + x + "/ARBPL") === this.workorderOperation.getProperty("/ARBPL")) {
                    aErrors.push({
                        TITLE: this.i18nGlobal.getProperty("General.error"),
                        SUBTITLE: this.i18n.getProperty("Error.ERR3")
                    });

                    flag = false;
                    this.getView().byId("opcWorkcenterSelect").setValueState("Error");
                    this.getView().byId("txtLTXA1").setValueState("Error");
                }
            }
        }

        this.mErrors.refresh();

        return flag;
    },

    checkEXT2: function (oControlEvent) {
        if (this.workorderOperation.getProperty("/STEUS") === "EXT2") {
            this.getView().byId("noLimitCheckboxFormElement").setVisible(true);
            this.getView().byId("longTextButtonFormElement").setVisible(true);
            this.getView().byId("estValFormElement").setVisible(true);
        } else {
            this.getView().byId("noLimitCheckboxFormElement").setVisible(false);
            this.getView().byId("longTextButtonFormElement").setVisible(false);
            this.getView().byId("estValFormElement").setVisible(false);
        }
    },

    distinguisherFormatter: function (distinguisher) {
        if (distinguisher < 10) {
            return "00" + distinguisher;
        } else if (distinguisher < 100) {
            return "0" + distinguisher;
        } else if (distinguisher < 1000) {
            return "" + distinguisher;
        } else {
            return ""; //we don't really handle more than 1000 operations for a workorder anyways
        }
    }
});