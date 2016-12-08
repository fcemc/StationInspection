var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('deviceready', onDeviceReady, true);
    },
    onDeviceReady: function () {
        app.receivedEvent('deviceready');
    },
    receivedEvent: function (id) {
        var _id = id;
        //var parentElement = document.getElementById(id);
        //var listeningElement = parentElement.querySelector('.listening');
        //var receivedElement = parentElement.querySelector('.received');

        //listeningElement.setAttribute('style', 'display:none;');
        //receivedElement.setAttribute('style', 'display:block;');
    }
};

function onDeviceReady() {
    document.addEventListener("resume", onResume, false);
    document.addEventListener("backbutton", function (e) {
        if ($("#home").length > 0) {
            // call this to get a new token each time. don't call it to reuse existing token.
            //pushNotification.unregister(successHandler, errorHandler);
            e.preventDefault();
            navigator.app.exitApp();
        }
        else {
            navigator.app.backHistory();
        }
    }, false);

}

function onResume() {
    checkCookie();
    checkForSync();
}


//function checkForSync() {
//    if (localStorage.getItem("allInspections") != "" && localStorage.getItem("allInspections") != null) {       
//        var ai = JSON.parse(localStorage.getItem("allInspections"));
//        $("#syncBtn").css("visibility", "visible");
//        if (ai.length > 0) {
//            if (navigator.onLine) {

//                $("#syncBtn").html("Sync Inspections (" + ai.length + ")");
//                $("#syncBtn").css("background-color", "orange");
//            }
//            else {
//                $("#syncBtn").html("Inspections that need to be Synced (" + ai.length + ")");
//                $("#syncBtn").css("background-color", "red");
//            }
//        }
//    }
//    else {
//        $("#syncBtn").css("visibility", "hidden");
//    }
//}