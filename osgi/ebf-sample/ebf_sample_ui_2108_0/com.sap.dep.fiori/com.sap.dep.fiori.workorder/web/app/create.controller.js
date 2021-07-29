jQuery.sap.require("dep.fiori.lib.controller.CreateControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.SelectGenericDialog");
jQuery.sap.require("dep.fiori.lib.util.SelectEquipmentDialog");

(function(CreateControllerBase, Utilities, SelectGenericDialog, SelectEquipmentDialog) {
CreateControllerBase.extend("dep.fiori.workorder.app.create", {

    onInit: function(oEvent) {
        CreateControllerBase.prototype.onInit.apply(this, arguments);
        
        var oDate = new Date();
        var sDate = dep.fiori.lib.util.Utilities.date.toYYYYMMDD(oDate);
        var sTime = dep.fiori.lib.util.Utilities.date.toHHMMSS(oDate);

        this.workorderPost = this.getObjectModel();
        this.workorderPost.setData({
            EQUNR: "",
            TPLNR: "",
            TPLNR_EXT: "",
            KTEXT: "",
            PRIOK: "3",
            VAPLZ: "",
            ILART: "",
            GSTRP: sDate,
            GLTRP: "",
            WERKS: "",
            MSAUS: " ",
            AUSVN: sDate, //set based on breakdown
            AUZTV: sTime, //set based on breakdown
            AUSBS: "00000000",
            AUZTB: "000000"
        });
        this.loadDefaultConfig();

        // this.mOData = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");
        this.mOData = new sap.ui.model.json.JSONModel({
            Workorder_Priority: []
        });
        this.getView().setModel(this.mOData, "odata");

        this.mActivity = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.mActivity, "activityTypes");

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

        var self = this;
        $.ajax("/ws_restful_data_controller/workorder_priority").done(function(aResponseData) {
            aResponseData = aResponseData || [];
            self.mOData.setProperty("/Workorder_Priority", aResponseData);
        });
    },

    onExit: function(){
        sap.ushell.Container.setDirtyFlag(false);
    },

    changeState: function(oEvent){
        sap.ushell.Container.setDirtyFlag(true);
        oEvent.getSource().setValueState("None");
    },

    handleLoadItems: function(oControlEvent) {
        oControlEvent.getSource().getBinding("items").resume();
    },

    handleMessagePopoverPress: function(oEvent){
        this.oMessagePopover.toggle(oEvent.getSource());
    },

    onEquipmentValueHelp: function(oEvent) {
        var self = this;
        SelectEquipmentDialog.getEquipment().done(function(oEquipment) {
            Object.assign(self.workorderPost.getData(), {
                EQUNR: oEquipment.EQUNR,
                EQKTX: oEquipment.EQKTX,
                TPLNR: oEquipment.TPLNR,
                TPLNR_EXT: oEquipment.TPLNR_EXT,
                PLTXT: oEquipment.PLTXT,
                ABCKZ: oEquipment.ABCKZ,
                KOSTL: oEquipment.KOSTL
            })
            self.workorderPost.refresh();
        });
    },

    workcenterPress: function(oEvent) {
        var oInput = oEvent.getSource();
        var self = this;
        $.ajax("/ws_restful_data_controller/workcenter").done(function(aResponseData) {
            dep.fiori.lib.util.SelectGenericDialog.getEntity({
                // sEntityPath: "/Workcenter",
                sEntityPath: aResponseData,
                aColumns: [
                    {
                        sHeader: self.getText("Operations.workCenter"),
                        sField: "VAPLZ"
                    },
                    {
                        sHeader: dep.fiori.lib.util.Utilities.geti18nGlobal("General.description"),
                        sField: "KTEXT"
                    }
                ]
            }).done(function(oWorkcenter) {
                oInput.setValue(oWorkcenter.VAPLZ);
            });
        });
    },

    breakdownSelect: function(oEvent){
        if (oEvent.getParameters().selected) { //just turned true (was previously false)
            this.workorderPost.setProperty("/MSAUS", "X");
        } else {
            this.workorderPost.setProperty("/MSAUS", " ");
        }
        this.changeState(oEvent);
    },

    workorderSave: function(oEvent) {
        var oSaveButton = oEvent.getSource();
        oSaveButton.setEnabled(false);

        // With the OData model this seems to be the easiest way of getting the text for a key
        var aWorkorderTypeItems = this.getView().byId("workorderTypeSelect").getItems();
        var sILART = this.workorderPost.getProperty("/ILART");
        for (var x = 0; x < aWorkorderTypeItems.length; x++) {
            var oBinding = aWorkorderTypeItems[x].getBindingContext("activityTypes").getObject();
            if (oBinding.ILART === sILART) {
                this.workorderPost.setProperty("/ILATX", oBinding.ILATX);
                break;
            }
        }

        var aPriorityItems = this.getView().byId("prioritySelect").getItems();
        var sPRIOK = this.workorderPost.getProperty("/PRIOK");
        for (var i = 0; i < aPriorityItems.length; i++) {
            var oPriorityBinding = aPriorityItems[i].getBindingContext("odata").getObject();
            if (oPriorityBinding.PRIOK === sPRIOK) {
                this.workorderPost.setProperty("/PRIOKX", oPriorityBinding.PRIOKX);
                break;
            }
        }

        this.workorderPost.setProperty("/GLTRP", this.workorderPost.getProperty("/GSTRP"));
        this.workorderPost.setProperty("/TPLNR_EXT", this.workorderPost.getProperty("/TPLNR"));

        if (!this.validate()) {
            sap.m.MessageToast.show(this.i18n.getProperty("Error.ERR1"), {
                closeOnBrowserNavigation: false
            });
            oSaveButton.setEnabled(true);
            return;
        }

        var self = this;
        Utilities.showBusyIndicator($.ajax({
            url: "/ws_restful_data_controller/workorder",
            data: this.workorderPost.getJSON(),
            method: "POST"
        }).done(function(oResponseData, errorText, errorThrown) {
            //oResponseData = jQuery.parseJSON(oResponseData);
            if (oResponseData[0].ErrorID) {
                sap.m.MessageToast.show(self.i18n.getProperty("Error.ERR2"), {
                    closeOnBrowserNavigation: false
                });
            } else {
                sap.ushell.Container.setDirtyFlag(false);
                self.aufnr = oResponseData[0].OBJECT_KEY;

                //set a model for main so that the workorder data can be retrieved in the new view
                self.workorderPost.setProperty("/AUFNR", self.aufnr);

                self.getOwnerComponent().setSavedWorkorder(self.workorderPost);

                if (oResponseData[0].RESULT.indexOf("WORKORDER_MODIFY") === -1 && oResponseData[0].STATUS === "200") {
                    sap.m.MessageToast.show( self.i18n.getProperty("Success.MSG1") + " (" + self.aufnr + ")", {
                        closeOnBrowserNavigation: false
                    });
                    self.toWorkorderDetail(self.aufnr);
                } else {
                    self.getDuplicateWODialog().open();
                }
            }
        }).fail(function() {
            sap.m.MessageToast.show(self.i18n.getProperty("Error.ERR2"));
        }).always(function() {
            oSaveButton.setEnabled(true);
        }));
    },

    getDuplicateWODialog: function () {
        if (!this.duplicateWODialog) {
            this.duplicateWODialog = sap.ui.xmlfragment("dep.fiori.workorder.app.duplicateworkorder", this);
            this.getView().addDependent(this.duplicateWODialog);
        }
        return this.duplicateWODialog;
    },

    duplicateWODialogOk: function(){
        this.getDuplicateWODialog().destroy();
        this.duplicateWODialog = null;
    },

    duplicateWODialogView: function(){
        this.getDuplicateWODialog().destroy();
        this.duplicateWODialog = null;
        this.toWorkorderDetail(self.aufnr);
    },

    loadDefaultConfig: function(){
        var self = this;
        $.ajax("/ws_restful_data_controller/default_values?for_object=workorder").done(function(oResponseData, errorText, errorThrown ){
            var defaultFields = {
                IS_EXTERNAL: "",
                ANLZU: "", //system condition
                ARBEI: "", //work involved in the activity
                AUART: "", //order type
                STEUS: "", //control key
                USER_STATUS: "",
                VORNR: ""
            };

            oResponseData.USER_STATUS = oResponseData.USER_STATUS || "INPL";
            oResponseData.AUART = oResponseData.AUART || "ZM01";
            oResponseData.STEUS = oResponseData.STEUS || "ZINT";
            self.loadActivityTypes(oResponseData.AUART);

            //merge defaults into template object
            Object.assign(self.workorderPost.getData(), defaultFields, oResponseData);

            //set global internationalization model
            self.i18n = self.getView().byId("workorderTitle").getModel("i18n");
            self.i18nGlobal = self.getView().byId("workorderTitle").getModel("i18nGlobal");
        });
    },

    loadActivityTypes: function(sAUART) {
        this.mActivity.setData([]);
        var sURL = "/ws_restful_data_controller/workorder_activity_type?AUART=" + sAUART;

        var self = this;
        return Utilities.showBusyIndicator($.ajax(sURL).done(function(aResponseData) {
            self.mActivity.setData(aResponseData);
        }));
    },

    formatters: {
        breakdown: function(MSAUS){
            return (MSAUS === "X");
        }
    },

    toWorkorderDetail: function(aufnr) {
        var sHash = "#depWorkorder-display&/" + aufnr;
        Utilities.navToExternal(sHash);
    },

    validate: function(){
        this.mErrors.setData([]);
        var aErrors = this.mErrors.getData();
        
        var bValid = this.validateRequiredFields();
        if (!bValid) {
            aErrors.push({
                TITLE: this.i18nGlobal.getProperty("General.error"),
                SUBTITLE: this.i18n.getProperty("Error.ERR1")
            });
        }
        this.mErrors.refresh();
        
        return bValid;

    }
});
}(dep.fiori.lib.controller.CreateControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.SelectGenericDialog, dep.fiori.lib.util.SelectEquipmentDialog));