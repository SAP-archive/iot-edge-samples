jQuery.sap.require("dep.fiori.lib.util.PurchaseRequisition");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

sap.ui.controller("dep.fiori.stockwanted.app.display", {

    onInit: function() {
        // "inherit" all functions from dep.fiori.lib.util.PurchaseRequisition
        for (var key in dep.fiori.lib.util.PurchaseRequisition) {
            if (dep.fiori.lib.util.PurchaseRequisition.hasOwnProperty(key)) {
                this[key] = dep.fiori.lib.util.PurchaseRequisition[key];
            }
        }

        this.oModel = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");
        this.oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

        this.oMessageTemplate = new sap.m.MessagePopoverItem({
            title: {
                path: "TITLE"
            },
            subtitle: {
                path: "SUBTITLE"
            },
            type: {
                path: "TYPE"
            },
            description: {
                path: "DESC"
            },
            counter: {
                path: "COUNTER"
            },
            markupDescription: {
                path: "MARKUP"
            }
        });

        this.oMessagePopover = this.getView().byId("ErrorMessagePopup") || new sap.m.MessagePopover(this.getView().createId("ErrorMessagePopup"), {
            items: {
                path: "/",
                template: this.oMessageTemplate
            },
            initiallyExpanded: true
        });

        this.purchaseReqPost = new sap.ui.model.json.JSONModel();
        this.purchaseReqPost.setData([{
            TDTXT : "",
            PRItemArray : ""
        }]);

        // mFrontEndErrors store data validation info in Front end while
        // mBackEndErrors store Error info in the Back End
        this.mFrontEndErrors = new sap.ui.model.json.JSONModel();
        this.mFrontEndErrors.setData([]);
        this.mBackEndErrors = new sap.ui.model.json.JSONModel();
        this.mBackEndErrors.setData([]);
        // mMessages store the error info for the message popup
        this.mMessages = new sap.ui.model.json.JSONModel();
        this.mMessages.setData([]);
        this.oMessagePopover.setModel(this.mMessages);

        this.oMessagesButton = this.getView().byId("messages-button");
        this.oMessagesButton.setModel(this.mMessages);
        this.mSelectedMaterial = new sap.ui.model.json.JSONModel();
        this.mSelectedMaterial.setData([]);
        this.purchaseReqPostArr = new sap.ui.model.json.JSONModel();
        this.purchaseReqPostArr.setData([]);

        this.getView().byId("swPage").setModel(this.oModel,"ODATA_MODEL");
        this.getView().byId("swPage").setModel(this.mSelectedMaterial,"SELECTED");
        this.getView().byId("swPage").setModel(this.mMessages,"POPUPMESSAGES");
        this.checkEnableArray = [];
        
        this.loadStockWantedList();
        
        dep.fiori.lib.util.DataAccess.getLookupModel({
            freightMode: "freight_modes"
        }).done(function(mLookup) {
            this.getView().setModel(mLookup, "lookup");
        }.bind(this));
    },

    errorTypeForMaterial: function(sMaterial) {
        var index = 0;
        var aErrors = this.mMessages.getData();
        for (var x = 0; x < aErrors.length; x++) {
            if (aErrors[x].MATNR === sMaterial && aErrors[x].TYPE === "Warning") {
                index = 1;
            }
            if (aErrors[x].MATNR === sMaterial && aErrors[x].TYPE === "Error") {
                return 2;
            }
        }
        return index;
    },

    StockOnHandFormatter: function(sMatnr, aSelected){
        for(var x = 0; x < aSelected.length; x++){
            if(aSelected[x].MATNR == sMatnr){
                return aSelected[x].ONHAND;
            }
        }
        return "";
    },

    iconSrcFormatter: function(sMaterial, aErrors) {
        var errorType = this.errorTypeForMaterial(sMaterial);
        if (errorType === 0 || errorType === 1) {
            return "sap-icon://message-warning";
        }
        return "sap-icon://message-error";
    },

    iconColorFormatter: function(sMaterial, aErrors) {
        var errorType = this.errorTypeForMaterial(sMaterial);
        if (errorType === 0 || errorType === 1) {
            return "#de890d";
        }
        return "#dc0d0e";
    },

    iconVisibilityFormatter: function(sMaterial, aErrors) {
        var errorType = this.errorTypeForMaterial(sMaterial);
        if ( errorType === 0 ) {
            return false;
        }
        return true;
    },

    onSelectionChange: function(oControlEvent) {
        var materialListId = oControlEvent.getParameters().listItem.getId();
        var self = this;
        var selectedItem = oControlEvent.getParameters().listItem;
        var selected = oControlEvent.getParameters().selected;
        var selectedIndex = selectedItem.getBindingContext("ODATA_MODEL").getPath();
        var matnr = this.oModel.getProperty( selectedIndex + "/MATNR");
        var aSelectedMaterials = this.mSelectedMaterial.getData();
        var i = -1;
        for (var n = 0; n < aSelectedMaterials.length; n++) {
            if (aSelectedMaterials[n].MATNR === matnr) {
                i = n;
                break;
            }
        }
        var aBackEndErrors = this.mBackEndErrors.getData();
        var aFrontEndErrors = this.mFrontEndErrors.getData();
        var aMessages = this.mMessages.getData();
        var temporaryModel = new sap.ui.model.json.JSONModel();
        temporaryModel.setData([]);
        temporaryModel.getData().push({
            MATNR : matnr
        });
        this.purchaseReqPost.setProperty("/0/PRItemArray", temporaryModel.getData());
        var mI18n = this.getView().getModel("i18n").getResourceBundle();
        var stockOnHandText = sap.ui.getCore().byId($("#" + materialListId + " .stockOnHand ," +
                    "#" + materialListId + "-sub .stockOnHand")[0].id);
        if ( selected ) {
            var onHandContainer;
            this.oModel.read(selectedIndex + "/ONHAND", {
                success: function(oResponseData) {
                    var aSelectedMaterials = self.mSelectedMaterial.getData();
                    for(var x =0; x < aSelectedMaterials.length; x++){
                        if(aSelectedMaterials[x].MATNR == matnr){
                            aSelectedMaterials[x].ONHAND = oResponseData.STOCK_ON_HAND;
                            self.mSelectedMaterial.refresh(true);
                        }
                    }
                },
                error: function(oResponseData) {
                }
            });
            if (i === -1) {
                aSelectedMaterials.push({
                    MATNR:matnr,
                    ERROR:false,
                    ONHAND:"",
                    APPROVED:[],
                    REJECTED:[],
                    WAITING:[],
                    PENDING:[]
                });
            }
            this.getView().byId("save-button").setEnabled(false);
            this.checkEnableArray.push(matnr);
            var indexOfMaterial = aSelectedMaterials.length - 1;
            jQuery.ajax({
                url: "/dep/odata",
                data: this.purchaseReqPost.getJSON(),
                method: "POST",
                headers: {
                    "REQUEST_OBJECT":"CHECK_PRMATERIAL_DUPLICATE"
                }
            }).done(function(oResponseData, errorText, errorThrown) {
                oResponseData = jQuery.parseJSON(oResponseData);
                var oResponseDataLength = oResponseData.length;
                var index = self.checkEnableArray.indexOf(matnr);
                self.checkEnableArray.splice(index);
                if (self.checkEnableArray.length === 0) {
                    self.getView().byId("save-button").setEnabled(true);
                }

                if (oResponseDataLength > 0) {
                    var bShowError = false;
                    for (var x = 0; x < oResponseDataLength; x++) {
                        if (oResponseData[x].PR_STATUS === "PENDING") {
                            aSelectedMaterials[indexOfMaterial].PENDING.push(
                                oResponseData[x].PR_NO_LOCAL
                            );
                        } else if (oResponseData[x].PR_STATUS === "REJECTED") {
                            aSelectedMaterials[indexOfMaterial].REJECTED.push(
                                oResponseData[x].PR_NO_LOCAL
                            );
                        } else if (oResponseData[x].PR_STATUS === "APPROVED") {
                            aSelectedMaterials[indexOfMaterial].APPROVED.push(
                                oResponseData[x].PR_NO_LOCAL
                            );
                        } else if (oResponseData[x].PR_STATUS === "WFAPPROVAL") {
                            aSelectedMaterials[indexOfMaterial].WAITING.push(
                                oResponseData[x].PR_NO_LOCAL
                            );
                        }

                        if (oResponseData[x].CONFIG === "N") {
                            bShowError = true;
                        }
                    }

                    var type = "";
                    var title = "";
                    if (bShowError === true) {
                        type = "Error";
                        title = mI18n.getText("Error.Duplication.error", [matnr]);
                    } else {
                        type = "Warning";
                        title = mI18n.getText("Error.Duplication.warning", [matnr]);
                    }
                    var desc = "";
                    desc = desc + self.recordMarkUpGenerator("APPROVED", aSelectedMaterials[indexOfMaterial].APPROVED);
                    desc = desc + self.recordMarkUpGenerator("PENDING", aSelectedMaterials[indexOfMaterial].PENDING);
                    desc = desc + self.recordMarkUpGenerator("REJECTED", aSelectedMaterials[indexOfMaterial].REJECTED);
                    desc = desc + self.recordMarkUpGenerator("WFAPPROVAL", aSelectedMaterials[indexOfMaterial].WAITING);
                    self.mBackEndErrors.getData().push({
                        TITLE: title,
                        REASON: mI18n.getText("ErrorReason.PRAlreadyExists"),
                        TYPE: type,
                        DESC: desc,
                        MARKUP : true,
                        MATNR:matnr
                    });
                    self.mMessages.getData().push({
                        TITLE: title,
                        REASON: mI18n.getText("ErrorReason.PRAlreadyExists"),
                        TYPE: type,
                        DESC: desc,
                        MARKUP : true,
                        MATNR:matnr
                    });
                }
                self.mFrontEndErrors.refresh(true);
                self.mBackEndErrors.refresh(true);
                self.mMessages.refresh(true);
                self.mSelectedMaterial.refresh(true);
            });
        } else if (i > -1) {
            stockOnHandText.setText("");
            for (var s = 0; s < aSelectedMaterials.length; s++) {
                if (aSelectedMaterials[s].MATNR === matnr) {
                    aSelectedMaterials.splice(s, 1);
                    s--;
                }
            }
            for (var e = 0; e < aMessages.length; e++) {
                if (aMessages[e].MATNR === matnr ) {
                    aMessages.splice(e,1);
                    e--;
                }
            }
            for (var f = 0; f < aFrontEndErrors.length; f++) {
                if (aFrontEndErrors[f].MATNR === matnr ) {
                    aFrontEndErrors.splice(f,1);
                    f--;
                }
            }
            for (var b = 0; b < aBackEndErrors.length; b++) {
                if (aBackEndErrors[b].MATNR === matnr ) {
                    aBackEndErrors.splice(b,1);
                    b--;
                }
            }
            sap.ui.getCore().byId($("#" + oControlEvent.getParameters().listItem.getId() + " .materialReqQuantity," +
                    "#" + oControlEvent.getParameters().listItem.getId() + "-sub .materialReqQuantity")[0].id).getBinding("value").refresh(true);
            sap.ui.getCore().byId($("#" + oControlEvent.getParameters().listItem.getId() + " .materialReqQuantity," +
                    "#" + oControlEvent.getParameters().listItem.getId() + "-sub .materialReqQuantity")[1].id).getBinding("value").refresh(true);
            sap.ui.getCore().byId($("#" + oControlEvent.getParameters().listItem.getId() + " .materialDeliveryByDate," +
                    "#" + oControlEvent.getParameters().listItem.getId() + "-sub .materialDeliveryByDate")[0].id).setValue(dep.fiori.lib.util.Utilities.date.currDateFormatted());
            sap.ui.getCore().byId($("#" + oControlEvent.getParameters().listItem.getId() + " .materialDeliveryByDate," +
                    "#" + oControlEvent.getParameters().listItem.getId() + "-sub .materialDeliveryByDate")[1].id).setValue(dep.fiori.lib.util.Utilities.date.currDateFormatted());
        }
        this.mFrontEndErrors.refresh(true);
        this.mBackEndErrors.refresh(true);
        this.mMessages.refresh(true);
        this.mSelectedMaterial.refresh(true);
    },

    checkEmptyInputWhenSaving: function() {
        var mI18n = this.getView().getModel("i18n").getResourceBundle();
        var table = this.getView().byId("material-table");
        var selectedItems = table.getSelectedItems();
        this.mFrontEndErrors.setData([]);
        this.mFrontEndErrors.refresh(true);
        var aMessages = this.mMessages.getData();
        for (var i = 0; i < aMessages.length; i++) {
            if ( aMessages[i].REASON === mI18n.getText("ErrorReason.QtyMissing") ) {
                aMessages.splice(i,1);
                this.mMessages.refresh(true);
                i--;
            }
        }

        for (var x = 0; x < selectedItems.length; x++) {
            var qtyInputForThisItem0 = sap.ui.getCore().byId($("#" + selectedItems[x].getId() + " .materialReqQuantity ," +
                    "#" + selectedItems[x].getId() + "-sub .materialReqQuantity ")[0].id).getValue();
            var qtyInputForThisItem1 = sap.ui.getCore().byId($("#" + selectedItems[x].getId() + " .materialReqQuantity ," +
                    "#" + selectedItems[x].getId() + "-sub .materialReqQuantity ")[1].id).getValue();

            var materialLabelText = sap.ui.getCore().byId($("#" + selectedItems[x].getId() + " .materialNumberLabelBlue ," +
                    "#" + selectedItems[x].getId() + "-sub .materialNumberLabelBlue ")[0].id).getText();
            if ( qtyInputForThisItem0 === "" &&
                qtyInputForThisItem1 === "") {
                this.mMessages.getData().push({
                    TITLE: mI18n.getText("Error.QtyMissing", [materialLabelText]),
                    REASON: mI18n.getText("ErrorReason.QtyMissing"),
                    TYPE: "Error",
                    MATNR:materialLabelText
                });
                this.mFrontEndErrors.getData().push({
                    TITLE: mI18n.getText("Error.QtyMissing", [materialLabelText]),
                    REASON: mI18n.getText("ErrorReason.QtyMissing"),
                    TYPE: "Error",
                    MATNR:materialLabelText
                });
                this.mMessages.refresh(true);
                this.mFrontEndErrors.refresh(true);
            }
        }
    },

    onFilter: function() {
        this.cleanTableSelection();
        var oBinding = this.getView().byId("material-table").getBinding("items");

        // get user input about measuring point and description for filtering
        var material = this.getView().byId("materialFilterInput").getValue();
        var description = this.getView().byId("descFilterInput").getValue();

        var MPFilter;
        if (!material) {
            MPFilter = new sap.ui.model.Filter("MATNR","Contains","");
        } else {
            MPFilter = new sap.ui.model.Filter("MATNR","Contains", material );
        }

        var desFilter;
        if (!description) {
            desFilter = new sap.ui.model.Filter("MAKTX","Contains","");
        } else {
            desFilter = new sap.ui.model.Filter("MAKTX","Contains", description );
        }

        var allFilter = new sap.ui.model.Filter([ MPFilter,desFilter],true);
        oBinding.filter(allFilter);
    },

    onSearch: function() {
        this.cleanTableSelection();
        var oBinding = this.getView().byId("material-table").getBinding("items");
        var searchContent = this.getView().byId("searchInput").getValue();
        var MPSearchFilter;
        var desSearchFilter;
        if (!searchContent) {
            MPSearchFilter = new sap.ui.model.Filter("MATNR","Contains", "" );
            desSearchFilter = new sap.ui.model.Filter("MAKTX","Contains", "" );
        } else {
            MPSearchFilter = new sap.ui.model.Filter("MATNR","Contains", searchContent );
            desSearchFilter = new sap.ui.model.Filter("MAKTX","Contains", searchContent );
        }
        var allFilter = new sap.ui.model.Filter([MPSearchFilter,desSearchFilter],false);
        oBinding.filter(allFilter);
    },

    cleanTableSelection: function() {
        this.getView().byId("material-table").removeSelections();
        this.mMessages.setData([]);
        this.mBackEndErrors.setData([]);
        this.mFrontEndErrors.setData([]);
    },

    onClear : function() {
        // clear the data stored in date picker
        var oBinding = this.getView().byId("material-table").getBinding("items");
        oBinding.aFilters = null;
        this.getView().byId("materialFilterInput").setValue("");
        this.getView().byId("descFilterInput").setValue("");
    },

    handleMessagePopoverPress: function(oEvent) {
        this.oMessagePopover.toggle(oEvent.getSource());
    },

    stockWantedSave: function() {
        var self = this;
        var mi18n = this.getView().getModel("i18n").getResourceBundle();
        this.checkEmptyInputWhenSaving();
        if (this.mFrontEndErrors.getData().length > 0) {
            sap.m.MessageToast.show(mi18n.getText("ToastMessage"));
            return;
        }

        var table = this.getView().byId("material-table");
        var selectedItems = table.getSelectedItems();
        if (selectedItems.length === 0) {
            return;
        }
        var aSelectedMaterials = this.mSelectedMaterial.getData();
        for (var i = 0; i < aSelectedMaterials.length; i++) {
            aSelectedMaterials[i].ERROR = false;
            aSelectedMaterials[i].PENDING = [];
            aSelectedMaterials[i].APPROVED = [];
            aSelectedMaterials[i].WAITING = [];
            aSelectedMaterials[i].REJECTED = [];
        }

        for (var n = 0; n < selectedItems.length; n++) {

            var qtyInput = $("#" + selectedItems[n].getId() + " .materialReqQuantity input," +
                "#" + selectedItems[n].getId() + "-sub .materialReqQuantity input");
            var datePicker = $("#" + selectedItems[n].getId() + " .materialDeliveryByDate input," +
                "#" + selectedItems[n].getId() + "-sub .materialDeliveryByDate input");

            var qty = qtyInput[0].value;
            var sDate = datePicker[0].value;

            if (qtyInput[0].value === "") {
                qty = qtyInput[1].value;
            }
            if (datePicker[0].value === "") {
                sDate = datePicker[1].value;
            }
            var oDate = new Date(sDate);

            var sFormattedDate = dep.fiori.lib.util.Utilities.date.toYYYYMMDD(oDate);
            
            // set the value of that Qty Input to null so that the next time
            // when we open the material list, we will have a brand new dialog
            sap.ui.getCore().byId($("#" + selectedItems[n].getId() + " .materialReqQuantity ," +
                "#" + selectedItems[n].getId() + "-sub .materialReqQuantity")[0].id).setValue();
            sap.ui.getCore().byId($("#" + selectedItems[n].getId() + " .materialReqQuantity ," +
                "#" + selectedItems[n].getId() + "-sub .materialReqQuantity")[1].id).setValue();
            // qtyInput.

            //var pathDateAndQty = selectedItems[n].getBindingContext("DATE_AND_QTY").getPath();
            var pathOData = selectedItems[n].getBindingContext("ODATA_MODEL").getPath();
            this.purchaseReqPostArr.getData().push({
                MATNR : this.oModel.getProperty(pathOData + "/MATNR"),
                TXZ01 : this.oModel.getProperty(pathOData + "/MAKTX"),
                MENGE : qty,
                MFRNR : this.oModel.getProperty(pathOData + "/MFRNR"),
                STOCK_ON_HAND : this.oModel.getProperty(pathOData + "/ONHAND/STOCK_ON_HAND"),
                LFDAT : sFormattedDate,
                FREIGHT_MODE : this.oModel.getProperty(pathOData + "/FREIGHT_MODE")
            });
        }
        this.purchaseReqPostArr.refresh();

        var aMaterials = this.purchaseReqPostArr.getData();
        var sBNFPO = "00000";
        for (var i = 0; i < aMaterials.length; i++) {
            aMaterials[i].IS_CHANGED = "I";
            aMaterials[i].BNFPO = String("00000" + (i + 1)).slice(-5);
        }

        this.purchaseReqPost.setProperty("/0/PRItemArray", aMaterials);
        this.purchaseReqPostArr.setData([]);
        this.mMessages.setData([]);
        dep.fiori.lib.util.Utilities.showBusyIndicator(jQuery.ajax({
            url: "/dep/odata",
            data: this.purchaseReqPost.getJSON(),
            method: "POST",
            headers: {
                "REQUEST_OBJECT":"PURCHASE_REQUISITIONS"
            }
        }).done(function(oResponseData, errorText, errorThrown) {
            oResponseData = jQuery.parseJSON(oResponseData);
            if (oResponseData[0].STATUS === "200") {
                for (var n = 0; n < selectedItems.length; n++) {
                    sap.ui.getCore().byId($("#" + selectedItems[n].getId() + " .stockOnHand ," +
                        "#" + selectedItems[n].getId() + "-sub .stockOnHand")[0].id).setText("");
                }
                self.mSelectedMaterial.setData([]);
                self.mSelectedMaterial.refresh(true);
                table.removeSelections(true);
                sap.m.MessageToast.show(mi18n.getText("Success.MSG1") + " " + oResponseData[0].OBJECT_KEY + " " + mi18n.getText("Success.MSG2"));

                var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
                oNavigationService.toExternal({
                    target: {
                        shellHash: "#depPurchasereq-display&/" + oResponseData[0].OBJECT_KEY
                    }
                });
            } else {
                for(var y = 0; y < aSelectedMaterials.length; y++){
                    aSelectedMaterials[y].TYPE = "None";
                }
                for (var x = 0; x < oResponseData.length; x++) {
                    for (var y = 0; y < aSelectedMaterials.length; y++) {
                        if (aSelectedMaterials[y].MATNR === oResponseData[x].MATNR) {
                            if (oResponseData[x].CONFIG === "N") {
                                aSelectedMaterials[y].TYPE = "Error";
                            }else{
                                if(aSelectedMaterials[y].TYPE === "Error"){

                                }else{
                                    aSelectedMaterials[y].TYPE = "Warning";
                                }
                            }
                            if (oResponseData[x].PR_STATUS === "PENDING") {
                                aSelectedMaterials[y].PENDING.push(
                                    oResponseData[x].PR_NO_LOCAL
                                );
                            } else if (oResponseData[x].PR_STATUS === "REJECTED") {
                                aSelectedMaterials[y].REJECTED.push(
                                    oResponseData[x].PR_NO_LOCAL
                                );
                            } else if (oResponseData[x].PR_STATUS === "APPROVED") {
                                aSelectedMaterials[y].APPROVED.push(
                                    oResponseData[x].PR_NO_LOCAL
                                );
                            } else if (oResponseData[x].PR_STATUS === "WFAPPROVAL") {
                                aSelectedMaterials[y].WAITING.push(
                                    oResponseData[x].PR_NO_LOCAL
                                );
                            }
                        }
                    }
                }
                for (var s = 0; s < aSelectedMaterials.length; s++) {
                    if( aSelectedMaterials[s].TYPE == "None"){
                        continue;
                    }
                    var type = "";
                    var desc = "";
                    var title = "";
                    desc = desc + self.recordMarkUpGenerator("APPROVED", aSelectedMaterials[s].APPROVED);
                    desc = desc + self.recordMarkUpGenerator("PENDING", aSelectedMaterials[s].PENDING);
                    desc = desc + self.recordMarkUpGenerator("REJECTED", aSelectedMaterials[s].REJECTED);
                    desc = desc + self.recordMarkUpGenerator("WFAPPROVAL", aSelectedMaterials[s].WAITING);
                    if (aSelectedMaterials[s].TYPE === "Error") {
                        title = mi18n.getText("Error.Duplication.error", [aSelectedMaterials[s].MATNR]);
                    } else {
                        title = mi18n.getText("Error.Duplication.warning", [aSelectedMaterials[s].MATNR]);
                    }
                    self.mMessages.getData().push({
                        TITLE: title,
                        REASON: mi18n.getText("ErrorReason.PRAlreadyExists"),
                        TYPE: aSelectedMaterials[s].TYPE,
                        DESC: desc,
                        MARKUP: true,
                        MATNR: aSelectedMaterials[s].MATNR
                    });
                    self.mBackEndErrors.getData().push({
                        TITLE: title,
                        REASON: mi18n.getText("ErrorReason.PRAlreadyExists"),
                        TYPE: aSelectedMaterials[s].TYPE,
                        DESC: desc,
                        MARKUP: true,
                        MATNR: aSelectedMaterials[s].MATNR
                    });
                }
                self.mMessages.refresh(true);
                self.mBackEndErrors.refresh(true);
                sap.m.MessageToast.show(mi18n.getText("ToastMessage"));
            }
        }));
    },
    
    loadStockWantedList: function() {
        return $.ajax("/ws_restful_data_controller/wanted_stock").done(function(aResponseData) {
            // TODO: replace odata model with this model
            this.getView().setModel(new sap.ui.model.json.JSONModel(aResponseData), "stockwanted");
        }.bind(this));
    },
    
    openDetailDialog: function(sMATNR) {
        if (!this.oDialog) {
            var sFragmentId = this.createId("detail");
            this.oDialog = sap.ui.xmlfragment(sFragmentId, "dep.fiori.stockwanted.app.detail", this).setModel(new sap.ui.model.json.JSONModel());
            this.oDetailTable = sap.ui.core.Fragment.byId(sFragmentId, "table");
            this.getView().addDependent(this.oDialog);
        }
        
        this.oDialog.getModel().setProperty("/MATNR", sMATNR);
        var aFilters = [
            new sap.ui.model.Filter("ZRES_IND", sap.ui.model.FilterOperator.EQ, ""),
            new sap.ui.model.Filter("ZMATNR", sap.ui.model.FilterOperator.EQ, sMATNR)            
        ]; 
        this.oDetailTable.getBinding("items").filter(aFilters);
        
        this.oDialog.open();
    },
    
    onItemPress: function(oEvent) {
        var oContext = oEvent.getParameter("listItem").getBindingContext("ODATA_MODEL");
        var oMaterial = oContext.getModel().getProperty(oContext.getPath());
        this.openDetailDialog(oMaterial.MATNR);
    },
    
    closeDialog: function(oEvent) {
        this.oDialog.close();
    }
});