jQuery.sap.setObject("dep.fiori.lib.util.DataAccess", {});
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DataAccess, Utilities) {
    var _oODataModels = {};

    var _aPermissions = null;

    // Check session whenever an ajax request is completed
    $(document).on("ajaxComplete", function(oEvent, oResponse, oAjaxOptions) {
        if (oResponse.statusCode === 401) {
            Utilities.showSessionExpiredDialog();
        } else {
            var sSessionExpiry = oResponse.getResponseHeader("Session-Expires");
            if (sSessionExpiry) {
                Utilities.updateTimeout(sSessionExpiry);
            }
        }
    });

    // Assign all these functions to the main object without overwriting
    Object.assign(DataAccess, {
        getODataModel: function(sServiceURL, oParams, bForceNewModel) {
            jQuery.sap.require("sap.ui.model.odata.CountMode");
            if (_oODataModels[sServiceURL] && !bForceNewModel) {
                return _oODataModels[sServiceURL];
            }

            oParams = Object.assign({
                json: true,
                defaultCountMode: sap.ui.model.odata.CountMode.None,
                disableHeadRequestForToken: true
            }, oParams || {});

            var fnRequestFailed = function(oEvent) {
                if (oEvent.getParameter("statusCode") === 401 ||
                    oEvent.getParameter("response").statusCode === 401) {
                    Utilities.showSessionExpiredDialog();
                }
            };

            _oODataModels[sServiceURL] = new sap.ui.model.odata.v2.ODataModel(sServiceURL, oParams)
                .attachMetadataFailed(fnRequestFailed)
                .attachRequestFailed(fnRequestFailed)
                .attachBatchRequestFailed(fnRequestFailed)
                .attachBatchRequestCompleted(function(oEvent) {
                    var oHeaders = oEvent.getParameter("response").headers;
                    if (oHeaders && oHeaders["Session-Expires"]) {
                        Utilities.updateTimeout(oHeaders["Session-Expires"]);
                    }
                }
            );

            return _oODataModels[sServiceURL];
        },

        getLookupModel: function(oRequestURLs) {
            var oPromise = $.Deferred();
            var aPromises = [];
            var oLookup = {};

            for (var sKey in oRequestURLs) {
                // Create a new scope so sProp is maintained for each promise
                (function() {
                    var sProp = sKey;
                    aPromises.push(
                        $.ajax({
                            url: "/ws_restful_data_controller/" + oRequestURLs[sKey]
                        }).done(function(oResponseData) {
                            oLookup[sProp] = oResponseData;
                        })
                    );
                }());
            }

            $.when.apply(this, aPromises).done(function() {
                oPromise.resolve(new sap.ui.model.json.JSONModel(oLookup));
            }).fail(function() {
                oPromise.reject();
            });

            return oPromise;
        },

        // Gets the list of permissions for the current user, prevents duplicate AJAX calls
        getPermissions: function() {
            _aPermissions = _aPermissions || $.ajax("/ws_restful_data_controller/permissions");
            return _aPermissions;
        }
    });
}(dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Utilities));