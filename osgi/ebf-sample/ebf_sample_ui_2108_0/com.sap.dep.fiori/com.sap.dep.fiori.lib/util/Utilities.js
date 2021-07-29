jQuery.sap.setObject("dep.fiori.lib.util.Utilities", {});
jQuery.sap.require("dep.fiori.lib.util.DataAccess");

(function (Utilities, DataAccess) {
    var _sHomeHash = null;

    var _oi18nGlobalModel = null;
    var _oi18nGlobalBundle = null;

    var _oSessionExpiry = null;
    var _oSessionTimeout = null;
    var _oSessionTimeoutDialog = null;
    var _oSessionTimeoutInterval = null;

    // Creates the session timeout warning dialog, and allows reuse of the same control
    var getSessionTimeoutDialog = function() {
        var oMessageBundle = Utilities.geti18nGlobal();
        if (!_oSessionTimeoutDialog) {
            _oSessionTimeoutDialog = new sap.m.Dialog({
                title: oMessageBundle.getText("SessionTimeout.imminent"),
                type: sap.m.DialogType.Message,
                state: sap.ui.core.ValueState.Warning,
                content: [
                    new sap.m.Text({
                        text: {
                            path: "/minutes",
                            formatter: function(iMinutes) {
                                iMinutes = iMinutes || 0;
                                return oMessageBundle.getText("SessionTimeout.message", [iMinutes]);
                            }
                        }
                    })
                ],
                beginButton: new sap.m.Button({
                    text: oMessageBundle.getText("SessionTimeout.keepWorking"),
                    press: function() {
                        $.ajax("/ws_launchpad/extendsession");
                        _oSessionTimeoutDialog.close();
                    }
                }),
                endButton: new sap.m.Button({
                    text: oMessageBundle.getText("SessionTimeout.logOut"),
                    press: function() {
                        sap.ushell.Container.logout();
                    }
                }),
                beforeClose: function(oEvent) {
                    clearInterval(_oSessionTimeoutInterval);
                }
            });
            _oSessionTimeoutDialog.setModel(new sap.ui.model.json.JSONModel());
        }
        return _oSessionTimeoutDialog;
    };

    var _bSessionExpiredDialogOpen = false;

    var _oUserImages = {};

    var _aFileIconMapping = [
        {
            icon: "sap-icon://pdf-attachment",
            extensions: [ "pdf" ]
        },
        {
            icon: "sap-icon://doc-attachment",
            extensions: [ "doc", "docx", "rtf", "txt" ]
        },
        {
            icon: "sap-icon://excel-attachment",
            extensions: [ "xls", "xlsx" ]
        },
        {
            icon: "sap-icon://ppt-attachment",
            extensions: [ "ppt", "pptx" ]
        },
        {
            icon: "sap-icon://attachment-photo",
            extensions: [ "jpg", "jpeg", "png", "gif", "bmp" ]
        },
        {
            icon: "sap-icon://attachment-zip-file",
            extensions: [ "zip", "rar", "7z" ]
        },
        {
            icon: "sap-icon://attachment-html",
            extensions: [ "html", "xml" ]
        }
    ];

    var _oDateFormatter = null;
    var _oTimeFormatter = null;
    var _oDateTimeFormatter = null;
    var getDateFormatter = function () {
        _oDateFormatter = _oDateFormatter || sap.ui.core.format.DateFormat.getDateInstance();
        return _oDateFormatter;
    };
    var getTimeFormatter = function () {
        _oTimeFormatter = _oTimeFormatter || sap.ui.core.format.DateFormat.getTimeInstance();
        return _oTimeFormatter;
    };
    var getDateTimeFormatter = function () {
        _oDateTimeFormatter = _oDateTimeFormatter || sap.ui.core.format.DateFormat.getDateTimeInstance();
        return _oDateTimeFormatter;
    };


    // Assign all these functions to the main object without overwriting
    Object.assign(Utilities, {
        getHomeHash: function () {
            _sHomeHash = _sHomeHash || jQuery.sap.getObject("sap-ushell-config.renderers.fiori2.componentData.config.rootIntent") || "#";
            return _sHomeHash;
        },

        navHome: function () {
            Utilities.navToExternal(Utilities.getHomeHash());
        },
        
        navToExternal: function(sShellHash) {
            var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
            oNavigationService.toExternal({
                target: {
                    shellHash: sShellHash
                }
            });
        },

        geti18nGlobalModel: function () {
            _oi18nGlobalModel = _oi18nGlobalModel || new sap.ui.model.resource.ResourceModel({
                bundleUrl: jQuery.sap.getModulePath("dep.fiori.lib.i18n") + "/i18n.properties"
            });

            return _oi18nGlobalModel;
        },

        // Gets the shared DEP i18n bundle, prevents refetching the resource once loaded
        // If a key is passed the resulting text will be returned instead of the entire bundle
        geti18nGlobal: function (sKey, aArgs) {
            _oi18nGlobalBundle = _oi18nGlobalBundle || Utilities.geti18nGlobalModel().getResourceBundle();

            if (sKey) {
                return _oi18nGlobalBundle.getText(sKey, aArgs);
            }

            return _oi18nGlobalBundle;
        },

        /*  Checks if the current user has one or more permissions (passed as a string or array of strings).
         *  Returns a promise, resolved if the user has all specified permissions, rejected otherwise.
         *  If the permissions list cannot be acquired for some reason, treat as a success.
         *  The in-database checks are where it really matters.
         */
        hasPermissions: function (aSignatures) {
            if (!Array.isArray(aSignatures)) {
                aSignatures = [ aSignatures ];
            }

            var oPromise = $.Deferred();

            DataAccess.getPermissions().done(function(aPermissions) {
                for (var i = 0; i < aSignatures.length; i++) {
                    if (aPermissions.indexOf(aSignatures[i]) === -1) {
                        oPromise.reject();
                        break;
                    }
                }
                if (oPromise.state() === "pending") {
                    oPromise.resolve();
                }
            }).fail(function() {
                oPromise.resolve();
            });

            return oPromise;
        },

        // Keeps a running setTimeout to show a 5 minute warning for session timeout
        updateTimeout: function(sSessionExpiry) {
            _oSessionExpiry = new Date(sSessionExpiry || _oSessionExpiry);
            if (_oSessionTimeout === null) {
                // Get milliseconds until session expiry minus 5 minutes
                var iTimeoutIn = (_oSessionExpiry - new Date()) - (5 * 60 * 1000);

                _oSessionTimeout = setTimeout(function() {
                    _oSessionTimeout = null;
                    // Check if the session timeout is actually 5 minutes away (with a 1000ms buffer)
                    var bTimeoutImminent = (_oSessionExpiry - new Date()) <= (5 * 60 * 1000 + 1000);
                    if (bTimeoutImminent) {
                        Utilities.showSessionWarningDialog();
                    } else {
                        Utilities.updateTimeout();
                    }
                }, iTimeoutIn);
            }
        },

        showSessionWarningDialog: function() {
            var oSessionTimeoutDialog = getSessionTimeoutDialog();
            var mTimer = oSessionTimeoutDialog.getModel();
            mTimer.setProperty("/expiry", _oSessionExpiry);

            // Function to update the remaining time in the dialog message
            var fnUpdateTimer = function() {
                var iMillisecondsLeft = mTimer.getProperty("/expiry") - new Date();
                if (iMillisecondsLeft <= 0) {
                    Utilities.showSessionExpiredDialog();
                } else {
                    var iMinutesLeft = Math.floor((iMillisecondsLeft + 100) / (60 * 1000));
                    mTimer.setProperty("/minutes", Math.max(iMinutesLeft, 0));
                }
            };

            // Call it once, then every 100ms until the session expires or action is taken
            fnUpdateTimer();
            clearInterval(_oSessionTimeoutInterval);
            _oSessionTimeoutInterval = setInterval(fnUpdateTimer, 100);

            if (!oSessionTimeoutDialog.isOpen()) {
                oSessionTimeoutDialog.open();
            }
        },

        showSessionExpiredDialog: function() {
            jQuery.sap.require("sap.m.MessageBox");
            if (_oSessionTimeoutDialog && _oSessionTimeoutDialog.isOpen()) {
                _oSessionTimeoutDialog.close();
            }

            var oMessageBundle = Utilities.geti18nGlobal();

            if (!_bSessionExpiredDialogOpen) {
                _bSessionExpiredDialogOpen = true;
                sap.m.MessageBox.error(oMessageBundle.getText("Error.sessionExpiredDesc"), {
                    title: oMessageBundle.getText("Error.sessionExpired"),
                    actions: [
                        oMessageBundle.getText("Error.logIn")
                    ],
                    onClose: function(oAction) {
                        _bSessionExpiredDialogOpen = false;
                        if (oAction === oMessageBundle.getText("Error.logIn")) {
                            sap.ushell.Container.logout();
                        }
                    }
                });
            }
        },

        getQueryString: function(oParams) {
            var aParams = [];
            for (var sKey in oParams) {
                aParams.push(sKey + "=" + oParams[sKey]);
            }

            var sURL = aParams.join("&");
            if (sURL) {
                return "?" + sURL;
            }
            return "";
        },

        downloadAttachment: function(oAttachment) {
            var oParams = {
                FILENAME: oAttachment.FILENAME,
                OBJECTTYPE: oAttachment.OBJECTTYPE,
                FILELOCATION: oAttachment.FILELOCATION,
                FILEDESC: oAttachment.FILEDESC
            };
            window.open("/wofetchattachment" + Utilities.getQueryString(oParams));
        },

        // Returns a promise. Gets the image for sUser or current user, prevents duplicate ajax calls.
        getUserImage: function(sUser) {
            var sURL = "/ws_restful_ehs_data_controller/user_image";

            if (sUser) {
                sURL += "?PLANTUSER=" + sUser;
            } else {
                var sLaunchpadImage = sap.ushell.Container.getUser().getImage();
                if (sLaunchpadImage) {
                    var promise = $.Deferred();
                    promise.resolve({
                        imageURL: sLaunchpadImage
                    });
                    return promise;
                }
            }

            _oUserImages[sUser] = _oUserImages[sUser] || $.ajax(sURL);
            return _oUserImages[sUser];
        },

        showBusyIndicator: function(oPromise) {
            sap.ui.core.BusyIndicator.show(0);
            if (oPromise) {
                oPromise.always(Utilities.hideBusyIndicator);
            }
            return oPromise;
        },

        hideBusyIndicator: function() {
            sap.ui.core.BusyIndicator.hide();
        },

        formatters: {
            date: function (YYYYMMDD) {
            	if(null == YYYYMMDD || YYYYMMDD == undefined){
            		return;
            	}
                return getDateFormatter().format(getDateFormatter().parse(YYYYMMDD));
            },

            time: function (HHMMSS) {
                return getTimeFormatter().format(getTimeFormatter().parse(HHMMSS));
            },

            dateTime: function(YYYYMMDD, HHMMSS) {
                var oDate = Utilities.date.fromDateAndTime(YYYYMMDD, HHMMSS);
                return getDateTimeFormatter().format(oDate);
            },
            

            formatJSDate: function (oDate) {
                return getDateFormatter().format(oDate);
            },

            formatJSDateTime: function (oDate) {
                return getDateTimeFormatter().format(oDate);
            },

            formatTimestamp: function (oTimestamp) {
                if (oTimestamp) {
                    return getDateTimeFormatter().format(new Date(oTimestamp));
                }
                return "N/A";
            },

            attachmentIcon: function(sFile) {
                if (sFile) {
                    sFile = sFile.split(".").pop().toLocaleLowerCase();
                    for (var i = 0; i < _aFileIconMapping.length; i++) {
                        if (_aFileIconMapping[i].extensions.indexOf(sFile) > -1) {
                            return _aFileIconMapping[i].icon;
                        }
                    }
                }
                return "sap-icon://document";
            }
        },

        date: {

            currDate: function () {
                return new Date();
            },

            currDateFormatted: function () {
                var oDate = new Date();
                return Utilities.date.toYYYYMMDD(oDate);
            },

            currDateNoTime: function () {
                var oDate = new Date();
                oDate.setHours(0, 0, 0, 0);
                return oDate;
            },

            toFriendlyDateString: function (oDate) {
                if (isNaN(oDate.getDate())) {
                    return "unknown";
                }
                var mNames = ["Jan", "Feb", "Mar",
                    "Apr", "May", "Jun", "Jul", "Aug", "Sep",
                    "Oct", "Nov", "Dec"];

                var currDate = oDate.getUTCDate();
                var currMonth = oDate.getMonth();
                var currYear = oDate.getFullYear();
                return mNames[currMonth] + " " + currDate + ", " + currYear;
            },

            fromYYYYMMDD: function (YYYYMMDD) {
                return new Date(getDateFormatter().parse(YYYYMMDD));
            },

            toYYYYMMDD: function (oDate) {
                if (!oDate){
                    return null;
                }
                var month = oDate.getMonth();
                var date = oDate.getDate();
                var year = oDate.getYear();
                // this is a simple algorithm for getting "YYYYMMDD" format
                // ex: year is 117, then (year + 1900) is 2017, month is 0, then (month + 1)
                // is 1, meaning january,
                var fullDate = (year + 1900) * 10000 + (month + 1) * 100 + date;
                var sFullDate = fullDate.toString();
                return sFullDate;
            },

            fromHHMMSS: function (HHMMSS) {
                return getTimeFormatter().format(getTimeFormatter().parse(HHMMSS));
            },

            toHHMMSS: function (oDate) {
                if (!oDate){
                    return null;
                }
                var hour = oDate.getHours();
                var minute = oDate.getMinutes();
                var second = oDate.getSeconds();

                var sFullTime = (("0" + hour).slice(-2)) + (("0" + minute).slice(-2)) + (("0" + second).slice(-2));
                return sFullTime;
            },

            toShortDate: function (YYYYMMDD) {
                if (!YYYYMMDD){
                    return null;
                }
                var year = YYYYMMDD.substring(0, 4);
                var month = YYYYMMDD.substring(4, 6);
                var day = YYYYMMDD.substring(6, 8);
                return day + "/" + month + "/" + year;
            },

            toShortDateDot: function (YYYYMMDD) {
                if (!YYYYMMDD){
                    return null;
                }
                var year = YYYYMMDD.substring(0, 4);
                var month = YYYYMMDD.substring(4, 6);
                var day = YYYYMMDD.substring(6, 8);
                return day + "." + month + "." + year;
            },

            fromDateAndTime: function (sDate, sTime) {
                var dateString = (sDate.indexOf("/") === -1) ? sDate.substring(0, 4) + "-" + sDate.substring(4, 6) + "-" + sDate.substring(6, 8) : sDate;
                var timeString = sTime.substring(0, 2) + ":" + sTime.substring(2, 4) + ":" + sTime.substring(4, 6);
                return new Date(dateString + " " + timeString);
            }
        },
        
        acquireLock: function(sObjType, sObjKey, bOverride) {
            var sQuery = Utilities.getQueryString({
                OBJ_KEY: sObjKey
            });
            var sMethod = bOverride ? "PUT" : "POST";            
            var oDeferred = $.Deferred();

            $.ajax({
                url: "/ws_restful_lock_controller/" + sObjType + sQuery,
                method: sMethod
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                if (oResponseData.LOCK_MESSAGE === "OK") {
                    oDeferred.resolve();
                } else {
                    oDeferred.reject(oResponseData);
                }
            }).fail(function() {
                oDeferred.reject();
            });
            
            return oDeferred.promise();
        },
        
        releaseLock: function(sObjType) {
            return $.ajax({
                url: "/ws_restful_lock_controller/" + sObjType,
                method: "DELETE"
            });
        }
    });
}(dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess));