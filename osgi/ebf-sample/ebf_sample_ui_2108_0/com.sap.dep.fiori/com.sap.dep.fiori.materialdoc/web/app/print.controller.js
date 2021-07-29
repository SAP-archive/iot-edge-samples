jQuery.sap.require("dep.fiori.lib.controller.PrintControllerBase");

(function(PrintControllerBase) {
    PrintControllerBase.extend("dep.fiori.materialdoc.app.print", {
        
        loadObjectData: function(sMBLNR) {
            var sURL = "/ws_restful_data_controller/material_docs?MBLNR=" + sMBLNR;
            return $.ajax(sURL);
        }
    
    });
}(dep.fiori.lib.controller.PrintControllerBase));