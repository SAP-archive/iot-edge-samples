jQuery.sap.setObject("dep.fiori.lib.util.Print", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(Print, Utilities) {
    
    var _oUrlParams = {
        objtype: "objtype",
        objids: "objids"
    };
    var _sKeyDelimiter = ",";
    var _sColDelimiter = "|";
    
    var _oResourceModels = {};
    
    var getUrl = function(sObjType, aObjIds) {
        var oParams = {};
        oParams[_oUrlParams.objtype] = sObjType;
        aObjIds = aObjIds.map(function(vId) {
            var sId = vId;
            if (Array.isArray(vId)) {
                sId = vId.join(_sColDelimiter);
            }
            return sId;
        });
        oParams[_oUrlParams.objids] = aObjIds.join(_sKeyDelimiter);
        return window.location.origin + window.location.pathname + "/print.html" + Utilities.getQueryString(oParams);
    };
    
    var getResourceModel = function(sResBundle) {
        if (!_oResourceModels[sResBundle]) {
            _oResourceModels[sResBundle] = new sap.ui.model.resource.ResourceModel({
                bundleName: sResBundle
            });
        }
        return _oResourceModels[sResBundle];
    };
    
    var createFragment = function(oController, sFragment, sResBundle) {
        var oFragment = sap.ui.xmlfragment(sFragment, oController);
        oFragment.setModel(getResourceModel("dep.fiori.lib.i18n.i18n"), "i18nGlobal");
        oFragment.setModel(getResourceModel(sResBundle), "i18n");
        
        var oDiv = document.createElement("div");
        oDiv.className = "print-section";
        document.body.appendChild(oDiv);
        oFragment.placeAt(oDiv);
        
        return oFragment;
    };
    
    var loadPage = function(aObjIds, sController, sFragment, sResBundle) {
        var oDeferred = $.Deferred();
        var aPromises = [];
        var oController = sap.ui.controller(sController);
        for (var i = 0; i < aObjIds.length; i++) {
            var oFragment = createFragment(oController, sFragment, sResBundle);
            var oPromise = oController.loadData(aObjIds[i], oFragment);
            aPromises.push(oPromise);
        }
        Utilities.showBusyIndicator($.when.apply(this, aPromises).done(oDeferred.resolve));
        return oDeferred.promise();
    };

    Object.assign(Print, {
        
        ObjectType: {
            WorkOrder: "workorder",
            MaterialDocument: "materialdoc",
            PhysicalInventoryDocument: "physicalinvdoc"
        },
        
        openPrintWindow: function(sObjType, aObjIds) {
            window.open(getUrl(sObjType, aObjIds), "_blank", "height=800,width=800,scrollbars=1");
        },
        
        loadPrintPage: function() {
            var oParams = new URLSearchParams(window.location.search);
            var sObjType = oParams.get(_oUrlParams.objtype);
            var aObjIds = oParams.get(_oUrlParams.objids).split(_sKeyDelimiter);
            aObjIds = aObjIds.map(function(sObjId) { return sObjId.split(_sColDelimiter); });
            
            var sControllerPath = ".app.print";
            var sFragmentPath = ".app.print";
            var sResBundlePath = ".i18n.i18n";
            
            var sModule;
            switch (sObjType) {
                case Print.ObjectType.WorkOrder:
                    sModule = "dep.fiori.workorder";
                    break;
                case Print.ObjectType.MaterialDocument:
                    sModule = "dep.fiori.materialdoc";
                    break;
                case Print.ObjectType.PhysicalInventoryDocument:
                    sModule = "dep.fiori.inventory";
                    break;
                default:
                    break;
            }
            
            if (sModule) {
                jQuery.sap.registerModulePath(sModule, "/dep_fiori_apps/com.sap." + sModule + "/web");
                loadPage(aObjIds, sModule + sControllerPath, sModule + sFragmentPath, sModule + sResBundlePath).done(function() {
                    window.print();
                });
            }
        }
        
    });
}(dep.fiori.lib.util.Print, dep.fiori.lib.util.Utilities));