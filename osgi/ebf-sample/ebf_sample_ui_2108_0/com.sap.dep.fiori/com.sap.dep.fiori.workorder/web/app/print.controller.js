jQuery.sap.require("dep.fiori.lib.controller.PrintControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(PrintControllerBase, Utilities) {
    PrintControllerBase.extend("dep.fiori.workorder.app.print", {
        
        loadObjectData: function(sAUFNR) {
            var oDeferred = $.Deferred();
            var oWorkOrderPromise = this.loadWorkOrderDetails(sAUFNR);
            var oOperationsPromise = this.loadOperations(sAUFNR);
            
            $.when(oWorkOrderPromise, oOperationsPromise).done(function(oWorkOrder, aOperations) {
                oWorkOrder.operations = aOperations;
                oDeferred.resolve(oWorkOrder);
            });
            
            return oDeferred.promise();
        },
        
        loadWorkOrderDetails: function(sAUFNR) {
            var oDeferred = $.Deferred();
            var sURL = "/ws_restful_data_controller/workorder?AUFNR=" + sAUFNR;
            
            $.ajax(sURL).done(function(aResponseData) {
                oDeferred.resolve(aResponseData[0]);
            });
            
            return oDeferred.promise();
        },
        
        loadOperations: function(sAUFNR) {
            var self = this;
            var oDeferred = $.Deferred();
            var sURL = "/ws_restful_data_controller/workorder_operations?AUFNR=" + sAUFNR;
            
            $.ajax(sURL).done(function(aResponseData) {
                var aPromises = [];
                for (var i = 0; i < aResponseData.length; i++) {
                    var oPromise = (function(i) {
                        return self.loadComponents(sAUFNR, aResponseData[i].VORNR).done(function(aComponents) {
                            aResponseData[i].components = aComponents;
                        });
                    })(i);
                    aPromises.push(oPromise);
                }
                $.when.apply(this, aPromises).done(function() {
                    oDeferred.resolve(aResponseData);
                });
            });
            
            return oDeferred.promise();
        },
        
        loadComponents: function(sAUFNR, sVORNR) {
            var sURL = "/ws_restful_data_controller/workorder_components_list" + Utilities.getQueryString({ AUFNR: sAUFNR, VORNR: sVORNR });
            return $.ajax(sURL);
        }
    });
}(dep.fiori.lib.controller.PrintControllerBase, dep.fiori.lib.util.Utilities));