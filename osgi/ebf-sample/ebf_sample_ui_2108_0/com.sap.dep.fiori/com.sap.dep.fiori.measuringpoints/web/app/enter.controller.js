jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(ListControllerBase, Filter, Utilities) {
    ListControllerBase.extend("dep.fiori.measuringpoints.app.enter", {
        onInit: function() {
            var self = this;
            
            this.setSortFragment("dep.fiori.measuringpoints.app.Dialog");
            this.setTable(this.byId("enter-measuring-point-table"));
            ListControllerBase.prototype.onInit.apply(this, arguments);
    
            this.oMessageTemplate = new sap.m.MessagePopoverItem({
                title: {
                    path: "POINT",
                    formatter: function(sPoint) {
                        return self.getView().getModel("i18n").getResourceBundle()
                            .getText("Error.validationmsg", [sPoint]);
                    }
                },
                subtitle: {
                    path: "ERR",
                    formatter: function(sErr) {
                        return self.getView().getModel("i18n").getProperty("Error." + sErr);
                    }
                },
                description: {
                    path: "ERR",
                    formatter: function(sErr) {
                        return self.getView().getModel("i18n").getProperty("Error." + sErr);
                    }
                }
            });
    
            this.oMessagePopover = new sap.m.MessagePopover({
                items: {
                    path: "/",
                    template: self.oMessageTemplate
                },
                initiallyExpanded: true
            });
    
            // array of modified points
            this.aModified = [];
    
            this.mErrors = new sap.ui.model.json.JSONModel();
            this.mErrors.setData([]);
    
            this.oMessagePopover.setModel(this.mErrors);
    
            this.oMessagesButton = this.getView().byId("messages-button");
            this.oMessagesButton.setModel(this.mErrors);
    
            this.mpList = new sap.ui.model.json.JSONModel();
    
            this.oSaveButton = this.getView().byId("save-button");
            this.oDatePicker = this.getView().byId("datePicker");
            this.oTimePicker = this.getView().byId("timePicker");
    
            this.getView().setModel(this.mpList);
            
            this.mOData = this.getODataModel();
            
            this.reloadList();
        },
    
        onExit: function(){
            sap.ushell.Container.setDirtyFlag(false);
        },
    
        formatters: {
            listTitle: function(itemCount) {
                var mI18n = this.getView().getModel("i18n");
                if (mI18n) {
                    return mI18n.getResourceBundle().getText("List.count", [itemCount]);
                }
                return null;
            },
    
            readingError: function(sPointId) {
                var aErrors = this.mErrors.getData();
                var aReadingErrors = [
                    "ERR1",
                    "ERR4",
                    "ERR5",
                    "ERR6",
                    "ERR7"
                ];
    
                for (var i = aErrors.length - 1; i >= 0; i--) {
                    if (aErrors[i].POINT === sPointId &&
                        aReadingErrors.indexOf(aErrors[i].ERR) > -1) {
    
                        return "Error";
                    }
                }
    
                return "None";
            },
    
            dateError: function(sPointId) {
                var aErrors = this.mErrors.getData();
                var aDateErrors = [
                    "ERR2",
                    "ERR3"
                ];
    
                for (var i = aErrors.length - 1; i >= 0; i--) {
                    if (aErrors[i].POINT === sPointId &&
                        aDateErrors.indexOf(aErrors[i].ERR) > -1) {
    
                        return "Error";
                    }
                }
    
                return "None";
            },
    
            datePickerEnabled : function(sReading){
                if (sReading != null && sReading.length > 0) {
                    return true;
                }
                return false;
            },
    
            saveButtonEnabled: function(){
                if (this.mErrors.getProperty("/length") === 0 &&
                    this.aModified.length > 0) {
                    return true;
                }
                return false;
            }
        },
    
        onReadingChange: function (oEvent) {
            var selectedIndex = oEvent.getSource().getBindingContext().getPath();
            var mList = this.getView().getModel();
    
            if (mList.getProperty(selectedIndex + "/RECDV_CHAR") == null || mList.getProperty(selectedIndex + "/RECDV_CHAR") == ""){
                mList.setProperty(selectedIndex + "/IDATE", mList.getProperty(selectedIndex + "/OLD_IDATE"));
                mList.setProperty(selectedIndex + "/ITIME", mList.getProperty(selectedIndex + "/OLD_ITIME"));
            } else {
                var now = new Date();
                var sDate = Utilities.date.toYYYYMMDD(now);
                var sTime = Utilities.date.toHHMMSS(now);
    
                if (oEvent.getSource().getId().indexOf("readingInput") > -1 &&
                    mList.getProperty(selectedIndex + "/IDATE") == mList.getProperty(selectedIndex + "/OLD_IDATE") &&
                    mList.getProperty(selectedIndex + "/ITIME") == mList.getProperty(selectedIndex + "/OLD_ITIME")) {
                    mList.setProperty(selectedIndex + "/IDATE", sDate);
                    mList.setProperty(selectedIndex + "/ITIME", sTime);
                }
            }
    
            //validate the new measurement
            this.validate(selectedIndex);
            mList.refresh(true);
            sap.ushell.Container.setDirtyFlag(true);
        },
    
        handleMessagePopoverPress: function(oEvent){
            this.oMessagePopover.toggle(oEvent.getSource());
        },
    
        toastFormatter: function(returnedJson){
            var mI18n = this.getView().getModel("i18n");
            var returnString= '';
            for(var x = 1; x < returnedJson.length; x++){
                returnString = returnString + mI18n.getResourceBundle().getText("ToastMessage.WorkOrderCreationSuccess",[returnedJson[x].OBJECT_KEY, returnedJson[x].POINT])+"\n";
            }
            return returnString;
        },
    
        measuringPointsSave: function(){
            this.payload = new sap.ui.model.json.JSONModel();
            this.payload.setData([]);
            var length = this.mpList.getData().length;
    
            var oMPData = this.mpList.getData();
            var oPayload = this.payload.getData();
    
            var c = 0;
            for (var x = 0; x < length; x++) {
    
                if (oMPData[x].RECDV_CHAR) {
                    this.payload.getData().push({
                        RECDV_CHAR: this.mpList.getData()[x].RECDV_CHAR
                    });
                    if (oMPData[x].PLTXT === null) {
                        oPayload[c].MDTXT = "";
                    } else {
                        oPayload[c].MDTXT = oMPData[x].PLTXT;
                    }
                    if (oMPData[x].IDATE === null) {
                        oPayload[c].IDATE = "";
                    } else {
                        if (oMPData[x].IDATE.substring(4,5) === "-"){
                            oPayload[c].IDATE = oMPData[x].IDATE.substring(0,4) + oMPData[x].IDATE.substring(5,7) + oMPData[x].IDATE.substring(8,10);
                        } else {
                            oPayload[c].IDATE = oMPData[x].IDATE;
                        }
                    }
                    if (oMPData[x].ITIME === null) {
                        oPayload[c].ITIME = "";
                    } else {
                        oPayload[c].ITIME = oMPData[x].ITIME;
                    }
                    if (oMPData[x].READR === null) {
                        oPayload[c].READR = "";
                    } else {
                        oPayload[c].READR = oMPData[x].READR;
                    }
                    if (oMPData[x].POINT === null) {
                        oPayload[c].POINT = "";
                    } else {
                        oPayload[c].POINT = oMPData[x].POINT;
                    }
                    c++;
                }
            }
    
            var oPromise = Utilities.showBusyIndicator($.Deferred());
            var self = this;
            this.mOData.update("/Measuring_Points", this.payload.getData() ,{
                success: function(oResponseData){
                    oResponseData = oResponseData.results;
                    var mI18n = self.getView().getModel("i18n");
                    sap.m.MessageBox.success(mI18n.getResourceBundle().getText("ToastMessage.Success")+"\n"+self.toastFormatter(oResponseData), {
                        title: "SUCCESS"
                    });
                    self.reloadList();
                    oPromise.resolve();
                },
                error: function(oResponseData, response){
                    if(oResponseData.statusText == "Authorization Required"){
                        sap.m.MessageToast.show(mI18n.getResourceBundle().getText("ToastMessage.AuthorizationRequired"));
                    }else{
                        sap.m.MessageToast.show("ErrorID: " + oResponseData[0].ErrorID + "\n" + "ErrorMsg: " + oResponseData[0].Parameter3.replace("RAISERROR executed: ", ""));
                    }
                    oPromise.resolve();
                }
            });
        },
    
        validate: function (selectedIndex) {
            var mList = this.getView().getModel();
    
            var newValue = mList.getProperty(selectedIndex + "/RECDV_CHAR");
            if (newValue === undefined || newValue === null) {
                newValue = "";
            }
    
            var newLastReading = parseInt(newValue, 10);
    
            var oldValue = mList.getProperty(selectedIndex + "/CNTRR_C");
            var oldLastReading = parseInt(oldValue, 10);
    
            var now = new Date();
    
            //Reset errors array model
            var aErrors = this.mErrors.getData();
    
            for (var i = 0; i < aErrors.length; i++) {
                if (aErrors[i].POINT === mList.getProperty(selectedIndex + "/POINT")) {
                    aErrors.splice(i, 1);
                    i--;
                }
            }
    
            this.mErrors.refresh();
    
            var sPointId = mList.getProperty(selectedIndex + "/POINT");
            var iModified = this.aModified.indexOf(sPointId);
    
            if (newValue === "") {
                this.mErrors.refresh();
                if (iModified > -1) {
                    this.aModified.splice(iModified, 1);
                }
                return;
            }
    
            if (iModified < 0) {
                this.aModified.push(sPointId);
            }
    
            //Find the difference in hours between the last reading and now
            var newDate = Utilities.date.fromDateAndTime(mList.getProperty(selectedIndex + "/IDATE"), mList.getProperty(selectedIndex + "/ITIME"));
    
            var oldDate = Utilities.date.fromDateAndTime(mList.getProperty(selectedIndex + "/OLD_IDATE"), mList.getProperty(selectedIndex + "/OLD_ITIME"));
            var diff = this.hourDiff(oldDate, newDate);
    
            if (!(newValue.match(/^-?\d+$/) || newValue.match(/^-?\d+\.\d+$/))) {
                //Value must be a valid number
                aErrors.push({
                    POINT: sPointId,
                    ERR: "ERR1"
                });
            }
    
            if (newDate < oldDate) {
                //new reading date cannot be before the old reading date
                aErrors.push({
                    POINT: sPointId,
                    ERR: "ERR2"
                });
            }
    
            if (newDate > now) {
                // new reading time cannot be in the future
                aErrors.push({
                    POINT: sPointId,
                    ERR: "ERR3"
                });
            }
    
            if (mList.getProperty(selectedIndex + "/MRMINI") === "X" && //a minimum reading exists
                        parseFloat(newValue) < parseFloat(mList.getProperty(selectedIndex + "/MRMIN"))) {
                // new reading cannot be less than the minimum value
                aErrors.push({
                    POINT: sPointId,
                    ERR: "ERR4"
                });
    
            } else if (mList.getProperty(selectedIndex + "/MRMAXI") === "X" && //a maximum reading exists
                        parseFloat(newValue) > parseFloat(mList.getProperty(selectedIndex + "/MRMAX"))) {
                // new reading cannot be greater than the maximum reading
                aErrors.push({
                    POINT: sPointId,
                    ERR: "ERR5"
                });
            }
    
            if (mList.getProperty(selectedIndex + "/INDCT") === "X" &&
                mList.getProperty(selectedIndex + "/INDRV") !== "X" &&
                       newLastReading < oldLastReading) {
                //Counter cannot run backwards
                aErrors.push({
                    POINT: sPointId,
                    ERR: "ERR6"
                });
            }
    
            if (mList.getProperty(selectedIndex + "/MRNGU") === "H" && //Unit is hours
                       (newLastReading - oldLastReading) > diff) {
                // Reading difference (in hours) cannot be higher than the number of hours since the last reading
                aErrors.push({
                    POINT: sPointId,
                    ERR: "ERR7"
                });
            }
    
            this.mErrors.refresh();
        },
    
        hourDiff : function(first, second) {
            return (second - first) / (1000 * 60 * 60); //*24
        },
    
        reloadList: function() {
            var self = this;
            this.mOData.read("/Measuring_Points", {
                context: null,
                success: function(oResponseData){
                    oResponseData = oResponseData.results;
                    var length = oResponseData.length;
    
                    for (var x = 0; x < length; x ++) {
                        oResponseData[x].RECDV_CHAR = null;
                        oResponseData[x].OLD_ITIME = oResponseData[x].ITIME;
                    }
    
                    self.mpList.setData(oResponseData);
                    self.aModified = [];
                    self.mpList.refresh(true);
    
                    sap.ushell.Container.setDirtyFlag(false);
                },
                error: function(oResponseData, response){
    
                }
            });
        },
    
        handleResponsivePopoverPress: function(oEvent) {
            jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
            var oSource = oEvent.getSource();
            var oBinding = oSource.getBindingContext();
            var oPoint = oBinding.getModel().getProperty(oBinding.getPath());
            var aTransactions = oBinding.getModel().getProperty(oBinding.getPath() + "/EDGE_ERRORS").split(',');
            dep.fiori.lib.util.ErrorPopover.openBy(oSource, aTransactions);
        },
        
        getFilterItems: function() {
            return [
                { key: "POINT", label: "{i18n>Page.measuringPoint}" },
                { key: "PTTXT", label: "{i18nGlobal>General.description}" },
                { key: "IDATE", label: "{i18nGlobal>General.date}", type: Filter.InputType.DateRange }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter, dep.fiori.lib.util.Utilities));