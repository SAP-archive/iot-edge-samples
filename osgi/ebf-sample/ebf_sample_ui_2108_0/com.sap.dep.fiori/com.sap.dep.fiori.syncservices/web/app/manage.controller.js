jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");

(function(DetailControllerBase, Utilities, DataAccess) {
	DetailControllerBase.extend("dep.fiori.syncservices.app.manage", {
    onInit: function() {
        var self = this;
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
                template: self.oMessageTemplate
            },
            initiallyExpanded: true
        });
        
        this.mErrors = new sap.ui.model.json.JSONModel();
        this.mErrors.setData([]);

        this.oMessagePopover.setModel(this.mErrors);
        this.oMessagesButton = this.getView().byId("messages-button");
        this.oMessagesButton.setModel(this.mErrors);

        this.mTimestamp = new sap.ui.model.json.JSONModel("/info/lastsync");
        this.getView().setModel(this.mTimestamp, "timestamp");
    },

    onRouteMatched: function(oEvent) {
        if (oEvent.getParameter("name") === "display") {
            this.mTimestamp.refresh();
        }
    },

    handleMessagePopoverPress: function(oEvent){
        this.oMessagePopover.toggle(oEvent.getSource());
    },
    
    onStartPress: function() {
        var self = this;
        jQuery.ajax({
            method: "POST",
            url: "/ws_restful_data_controller/STARTSERVICE"
        }).done(function(oResponseData, errorText, errorThrown ){
            if (oResponseData[0].ErrorID) {
                sap.m.MessageToast.show(oResponseData[0].ErrorMsg || i18n.getProperty("Error.generalError"), {
                    closeOnBrowserNavigation: false
                });
            } else {
                if (oResponseData[0].STATUS == "200") {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.success", [oResponseData[0].OBJECT_KEY]), {
                        closeOnBrowserNavigation: false
                    });
                } else {
                    sap.m.MessageToast.show(oResponseData[0].ErrorMsg || i18n.getProperty("Error.generalError"), {
                        closeOnBrowserNavigation: false
                    });
                }
            }
        });
    },

    onStopPress: function(){
        var self = this;
        jQuery.ajax({
            method: "POST",
            url: "/ws_restful_data_controller/STOPSERVICE"
        }).done(function(oResponseData, errorText, errorThrown ){
            if (oResponseData[0].ErrorID) {
                sap.m.MessageToast.show(oResponseData[0].ErrorMsg || i18n.getProperty("Error.generalError"), {
                    closeOnBrowserNavigation: false
                });
            } else {
                if (oResponseData[0].STATUS == "200") {
                    sap.m.MessageToast.show(i18n.getResourceBundle().getText("Toast.success", [oResponseData[0].OBJECT_KEY]), {
                        closeOnBrowserNavigation: false
                    });
                } else {
                    sap.m.MessageToast.show(oResponseData[0].ErrorMsg || i18n.getProperty("Error.generalError"), {
                        closeOnBrowserNavigation: false
                    });
                }
            }
        });
    },
});
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess));
