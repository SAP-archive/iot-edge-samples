jQuery.sap.require("dep.fiori.lib.controller.PrintControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(PrintControllerBase, Utilities) {
    PrintControllerBase.extend("dep.fiori.inventory.app.print", {
        
        loadObjectData: function(sINV_NO_LOCAL, sLGORT, sGJAHR) {
            var oId = {
                INV_NO_LOCAL: sINV_NO_LOCAL,
                LGORT: sLGORT,
                GJAHR: sGJAHR
            };
            var sQuery = Utilities.getQueryString(oId);
            var sURL = "/ws_restful_data_controller/physical_inventory_documents" + sQuery;
            return $.ajax(sURL);
        }
    
    });
}(dep.fiori.lib.controller.PrintControllerBase, dep.fiori.lib.util.Utilities));