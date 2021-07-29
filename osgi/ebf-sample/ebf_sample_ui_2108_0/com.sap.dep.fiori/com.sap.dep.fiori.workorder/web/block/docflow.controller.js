jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailBlockControllerBase, Utilities) {
    DetailBlockControllerBase.extend("dep.fiori.workorder.block.docflow", {
        onInit: function() {
            this.setKey("AUFNR");
            this.setBlockId("docflow");
            
            this.mDocFlow = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mDocFlow);
        },
        
        loadData: function(sAUFNR) {
            this.loadDocFlow(sAUFNR);
        },
        
        loadDocFlow: function(sAUFNR) {
            var sURL = "/ws_restful_data_controller/workorder_docflow?AUFNR=" + sAUFNR;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(oResponseData) {
                this.mDocFlow.setData(oResponseData);
            }.bind(this)));
        },
        
        onPress: function(oEvent) {
            var oContext = oEvent.getParameter("listItem").getBindingContext();
            var sHash = this.getHash(oContext.getProperty("desc"), oContext.getProperty("text"));
            Utilities.navToExternal(sHash);
        },
        
        getHash: function(sKey, sValue) {
            var sAUFNR = this.getKeyValue();
            var sHash;
            switch (sKey) {
                case "QMNUM":
                    sHash = "#depNotification-display&/" + sAUFNR;
                    break;
                case "AUFNR":
                    sHash = "#depWorkorder-display&/" + sValue + "/detail";
                    break;
                case "VORNR":
                    sHash = "#depWorkorder-display&/" + sAUFNR + "/operations/" + sValue;
                    break;
                case "BANFN":
                    sHash = "#depPurchasereq-display&/" + sValue;
                    break;
                case "EBELN":
                    sHash = "#depPurchaseorder-display&/" + sValue;
                    break;
                case "GI":
                case "GR":
                    sHash = "#depMaterialDoc-display&/" + sValue;
                    break;
                default:
                    sHash = "#";
                    break;
            }
            return sHash;
        },
        
        treeItemTitleFormatter: function(sKey, sValue, sMaterial, sQuantity) {
            var sText;
            switch (sKey) {
                case "QMNUM":
                    sText = this.getText("DocFlow.notification", sValue);
                    break;
                case "AUFNR":
                    sText = this.getText("DocFlow.workOrder", sValue);
                    break;
                case "VORNR":
                    sText = this.getText("DocFlow.operation", sValue);
                    break;
                case "BANFN":
                    sText = this.getText("DocFlow.purchaseReq", sValue);
                    break;
                case "EBELN":
                    sText = this.getText("DocFlow.purchaseOrder", sValue);
                    break;
                case "GI":
                    sText = this.getText("DocFlow.matDocGI", [ sValue, sMaterial, sQuantity ]);
                    break;
                case "GR":
                    sText = this.getText("DocFlow.matDocGR", [ sValue, sMaterial, sQuantity ]);
                    break;
                default:
                    sText = "";
                    break;
            }
            return sText;
        }
    });
}(dep.fiori.lib.controller.DetailBlockControllerBase, dep.fiori.lib.util.Utilities));