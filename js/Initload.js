var tryingToReconnect = false, user, scanResult = 0, inspectionType;;
var checkList = ["1", "2", "4", "5", "6a", "6b", "6c", "6d", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "20a", "20b", "20c", "20d", "20e", "20f", "20g", "21", "22", "23", "24", "25", "26", "27", "28"];
var regHistData, brkrHistData, svcUrl = "http://gis.fourcty.org/inspectrest/inspectionservice.svc/";
$(document).ready(function () {
    //adjust for status bar in iOS
    //if (/iPad|iPod|iPhone/i.test(navigator.userAgent)) {
    //    $("body").css("background-color", "black");
    //    $("div[role='dialog']").css("background-color", "#efecec");
    //    $(".pg").css({ "margin-top": "20px" });
    //}

    if (navigator.onLine) {
        checkCookie();
        getSpinner();
        $("#spinCont").hide();

        toastr.options = {
            "closeButton": false,
            "debug": false,
            "newestOnTop": false,
            "progressBar": false,
            "positionClass": "toast-bottom-right",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "0",
            "hideDuration": "0",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        }
        getStationData();

    }
    else {
        if (navigator.notification.confirm("No network connection detected, check settings and try again!", networkIssue, "Please Confirm:", "Cancel, Ok")) {
            window.location.reload();
        }
        else {
            $.mobile.pageContainer.pagecontainer("change", "#pageLogin");
            
        }
    }

    $("#cancelInspection").click(cancel);
    $("#saveInspection").click(save);

    checkForSync();

    $("body").keydown(function () {
        if (event.keyCode == 13) {
            document.activeElement.blur();
            return false;
        }
    });

    $("#xHistTable").wijgrid({
        highlightOnHover: false,
        showSelectionOnRender: false,
        allowSorting: false,
        allowPaging: true,
        pageSize: 5,
        scrollMode: "auto"
    });

    $("#rHistTable").wijgrid({
        highlightOnHover: false,
        showSelectionOnRender: false,
        allowSorting: false,
        allowPaging: true,
        pageSize: 5,
        scrollMode: "auto"
    });

    $("#bHistTable").wijgrid({
        highlightOnHover: false,
        showSelectionOnRender: false,
        allowSorting: false,
        allowPaging: true,
        pageSize: 5,
        scrollMode: "auto"
    });

    $("#select-bHist").change(function () {
        if (brkrHistData != undefined) {
            switch (getType("", $("#histStationName").text())) {
                case "SUB":
                    getSubBrkrHist($("#select-bHist option:selected").text());
                    break;
                case "POD":
                    getPodbBrkrHist($("#select-bHist option:selected").text());
                    break;
                case "SWI":
                    getPodbBrkrHist($("#select-bHist option:selected").text());
                    break;
            }
        }
    });

    $("#select-rHist").change(function () {
        if (regHistData != undefined) {
            getSubRegHist($("#select-rHist option:selected").text());
        }
    });
});

//region Login&Cookies
function checkLogin() {
    //$.mobile.pageContainer.pagecontainer("change", "#page1");

    user = $("#un").val().trim();
    var _pw = $("#pw").val().trim();
    var paramItems = user + "|" + _pw;
    $.ajax({
        type: "GET",
        url: "http://gis.fourcty.org/FCEMCrest/FCEMCDataService.svc/authenticateYouSir/" + paramItems,
        contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (results) {
            if (results.authenticateYouSirResult) {
                $("#loginError").text("");

                $.mobile.pageContainer.pagecontainer("change", "#page1");
                if (localStorage.fcemcStation_uname == undefined || localStorage.fcemcStation_pass == "") {
                    setCookie(user, _pw, 1); //expires 1 day from inital login
                }
            }
            else {
                //window.localStorage.clear();
                localStorage.setItem("fcemcStation_uname", "");
                localStorage.setItem("fcemcStation_pass", "");

                $("#loginError").text("Login Unsucessful");
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            var e = errorThrown;
            if (!(navigator.onLine)) {
                $("#loginError").text("No network connection - cannot login!");
            }
            else {
                $("#loginError").text("Login Unsucessful");
            }
        }
    });
}
function setCookie(u, p, t) {
    //window.localStorage.clear();
    localStorage.setItem("fcemcStation_uname", u);
    localStorage.setItem("fcemcStation_pass", p);
    var d = new Date();
    d.setDate(d.getDate() + t);
    d.setHours(6);
    d.setMinutes(00);
    d.setSeconds(00);
    localStorage.setItem("fcemcStationtimeout", d);
}
function getCookie() {
    var isCookies = false;
    if (localStorage.fcemcStation_uname != null && localStorage.fcemcStation_pass != null && localStorage.fcemcStation_uname != "" && localStorage.fcemcStation_pass != "" && new Date(localStorage.fcemcStationtimeout) > new Date()) {
        isCookies = true;
    }
    return isCookies;
}
function checkCookie() {
    var valid = getCookie();
    if (valid == true) {
        $("#un").val(localStorage.fcemcStation_uname);
        $("#pw").val(localStorage.fcemcStation_pass);
    }
    else {
        localStorage.setItem("fcemcStation_uname", "");
        localStorage.setItem("fcemcStation_pass", "");
        $(":mobile-pagecontainer").pagecontainer("change", "#pageLogin");
    }

}
function getSpinner() {
    var opts = {
        lines: 12             // The number of lines to draw
        , length: 7             // The length of each line
        , width: 5              // The line thickness
        , radius: 10            // The radius of the inner circle
        , scale: 1.0            // Scales overall size of the spinner
        , corners: 1            // Roundness (0..1)
        , color: '#000'         // #rgb or #rrggbb
        , opacity: 1 / 4          // Opacity of the lines
        , rotate: 0             // Rotation offset
        , direction: 1          // 1: clockwise, -1: counterclockwise
        , speed: 1              // Rounds per second
        , trail: 100            // Afterglow percentage
        , fps: 20               // Frames per second when using setTimeout()
        , zIndex: 2e9           // Use a high z-index by default
        , className: 'spinner'  // CSS class to assign to the element
        , top: '50%'            // center vertically
        , left: '50%'           // center horizontally
        , shadow: false         // Whether to render a shadow
        , hwaccel: false        // Whether to use hardware acceleration (might be buggy)
        , position: 'absolute'  // Element positioning
    }
    var target = document.getElementById('spinwheel');
    spinner = new Spinner(opts).spin(target);
}
function changePage(page) {
    $.mobile.pageContainer.pagecontainer("change", "#" + page, {
        //transition: 'flip',
        changeHash: false,
        reverse: true,
        showLoadMsg: true
    });
}
function networkIssue(button) {
    if (button == 2) {
        window.location.reload();
    }
    else if (button == 1) {
        $.mobile.pageContainer.pagecontainer("change", "#pageLogin");

    }
}
function fakeCallback() { }
//endregion

function getStationData() {
    $.ajax({
        type: "GET",
        url: svcUrl + "STATIONDATA",
        contentType: "application/json; charset=utf-8",
        dataType: 'jsonp',
        cache: false,
        beforeSend: function () {
            $("#spinCont").show();
        },
        success: function (results) {
            try {
                var s = results.STATIONDATAResult.stations;
                var x = results.STATIONDATAResult.xfrmrs;
                var b = results.STATIONDATAResult.breakers;
                var r = results.STATIONDATAResult.regulators;
                var stations = [], xfrmrs = [], breakers = [], regulators = [];
                $('#select-station option').remove();

                if (JSON.parse(localStorage.getItem("station_xfrmrs")) != null) {
                    localStorage.removeItem("station_stations")
                    localStorage.removeItem("station_xfrmrs")
                    localStorage.removeItem("station_breakers")
                    localStorage.removeItem("station_regulators")
                }

                for (a = 0; a < x.length; a++) {
                    xfrmrs.push(x[a].SID + "|" + x[a].XFRMR + "|" + x[a].RATING);
                }
                localStorage.setItem("station_xfrmrs", JSON.stringify(xfrmrs));

                for (c = 0; c < b.length; c++) {
                    breakers.push(b[c].SID + "|" + b[c].BRKID);
                }
                localStorage.setItem("station_breakers", JSON.stringify(breakers));

                for (d = 0; d < r.length; d++) {
                    regulators.push(r[d].SID + "|" + r[d].REGID);
                }
                localStorage.setItem("station_regulators", JSON.stringify(regulators));

                $('#select-station').append($('<option/>', { value: "-1", text: "Select Station..." }));
                for (e = 0; e < s.length; e++) {
                    stations.push(s[e].IDKEY + "|" + s[e].NAME + "|" + s[e].TYPE + "|" + s[e].DESCR);
                    $('#select-station').append($('<option/>', { value: s[e].IDKEY, text: s[e].NAME }));
                }
                localStorage.setItem("station_stations", JSON.stringify(stations));
            }
            catch (error) {
                //alert(error);
            }
        },
        complete: function () {
            $("#spinCont").hide();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (navigator.notification != undefined) {
                navigator.notification.alert("Unalbe to update stations: " + errorThrown.toString(), fakeCallback, "Network Issue", "Ok");
            }
            else {
                alert("Unalbe to update stations: " + errorThrown.toString());
            }
        }
    });
}

function getType(id, name) {
    var type;
    var sx = JSON.parse(localStorage.getItem("station_stations"));
    for (g = 0; g < sx.length; g++) {
        if (id != "") {
            if (sx[g].split("|")[0] == id) {
                type = sx[g].split("|")[2];
            }
        }
        else if (name != "") {
            if (sx[g].split("|")[1] == name) {
                type = sx[g].split("|")[2];
            }
        }
    }
    return type;
}

//region Add inspection
function addInspection() {
    var stationId = $('#select-station').val();
    if (stationId != -1) {
        changePage('newInspectionPage');
        var stationName = $('#select-station').find(":selected").text();
        $("#inpsecitonStationName").text(stationName);
        popInspectForm(stationId);
    }
    else if (stationId == -1) {
        if (navigator.notification != undefined) {
            navigator.notification.alert("No station selected!", fakeCallback, "Station Selection", "Ok");
        }
        else {
            alert("No station selected!");
        }
    }
}

function popInspectForm(id) {
    $("#sourceBlock").html("");
    $("#regBlock").html("");
    $("#breakerBlock").html("");

    var s = JSON.parse(localStorage.getItem("station_stations")) //IDKEY|NAME|TYPE|DESCR
    var x = JSON.parse(localStorage.getItem("station_xfrmrs")) //SID|XFRMR|RATING
    var b = JSON.parse(localStorage.getItem("station_breakers")) //SID|BRKID
    var r = JSON.parse(localStorage.getItem("station_regulators")) //SID|REGID

    for (var a = 0; a < s.length; a++) {
        if (s[a].split("|")[0] === id) {
            inspectionType = s[a].split("|")[2];
            break;
        }
    }

    if (inspectionType == "SUB") {
        buildSubForm(id, x, b, r);
    }
    else if (inspectionType == "SWI" || inspectionType == "POD") {
        buildSwitchPODForm(inspectionType, id, x, b);
    }
}

function buildSubForm(id, x, b, r) {
    if (!($("#regs").hasClass("bdr"))) {
        $("#regs").css("visibility", "visible").css("height", "auto").addClass("bdr");
    }


    $("#sourceBlock").html("");
    for (var a = 0; a < x.length; a++) {
        if (x[a].split("|")[0] === id) {
            var str = "<label class='txtlo1''>kW Demand Value:</label><input class='input1' type='number' id='kWDemandValue' />";
            str += "<label class='txtlo2'>Kwh Use Value:</label><input class='input1' type='number' id='KwhUseValue' />";
            str += "<label class='txtlo2'>Station Battery:</label><input class='input1' type='number' id='StationBattery' />";
            str += "<div><label class='txtlo1'>Transformer: </label><label class='txtlo1' id='xfrmr'>" + "<b>" + x[a].split("|")[1].toString() + "</b>" + "</label><label class='txtlo2'>Transformer Rating:</label><label class='txtlo2' id='rating'>" + "<b>" + x[a].split("|")[2].toString() + "</b>" + "</label></div>";
            str += "<label class='txtlo1'>Wind. Temp High:</label><input class='input1' type='number' id='WindTempHigh' />";
            str += "<label class='txtlo2'>Wind. Temp Now:</label><input class='input1' type='number' id='WindTempNow' />";
            str += "<label class='txtlo2'>Pressure:</label><input class='input1' type='number' id='Pressure' />";
            str += "<label class='txtlo2'>Liquid Temp(C°):</label><input class='input1' type='number' id='LiquidTemp' />";
            str += "<label class='txtlo2'>N2(lbs):</label><input class='input1' type='number' id='N2' />";
            str += "<label>Remarks:</label><input style='width:99%;' type='text' id='xremarks' />";
            $("#sourceBlock").html(str);
            break;
        }
    }

    $("#regBlock").html("");
    var rowR = "<table><tr><td>Regulator</td><td class='tc1'>Counter</td><td class='tc1'>Max Raised</td><td class='tc1'>Max Lowered</td><td class='tc1'>Unreg Volt</td><td class='tc1'>Reg Volt</td><td class='tc2'>Remarks</td></tr>"
    for (var a = 0; a < r.length; a++) {
        if (r[a].split("|")[0] === id) {
            var regID = r[a].split("|")[1].toString();
            rowR += "<tr><td>" + "<b>" + regID + "</b>" + "</td>";
            rowR += "<td><input class='tc1' id='regC_" + regID + "' type='number' /></td>";
            rowR += "<td><input class='tc1' id='regMR_" + regID + "' type='number' /></td>";
            rowR += "<td><input class='tc1' id='regML_" + regID + "' type='number' /></td>";
            rowR += "<td><input class='tc1' id='regUV_" + regID + "' type='number' /></td>";
            rowR += "<td><input class='tc1' id='regRV_" + regID + "' type='number' /></td>";
            rowR += "<td><input class='tc2' id='regRem_" + regID + "' type='text' /></td></tr>";
        }
    }
    rowR += "</table>";
    $("#regBlock").html(rowR);


    $("#breakerBlock").html("");
    var rowB = "<table><tr><td>Breaker</td><td class='tc1'>Battery Volts</td><td class='tc1'>A-ph Counter</td><td class='tc1'>B-ph Counter</td><td class='tc1'>C-ph Counter</td><td class='tc1'>Total OPs</td><td class='tc2'>Remarks</td></tr>";
    for (var a = 0; a < b.length; a++) {
        if (b[a].split("|")[0] === id) {
            var brID = b[a].split("|")[1].toString();
            rowB += "<tr><td>" + "<b>" + brID + "</b>" + "</td>";
            rowB += "<td><input class='tc' id='brBV_" + brID + "' type='number' /></td>";
            rowB += "<td><input class='tc' id='brA_" + brID + "' type='number' /></td>";
            rowB += "<td><input class='tc' id='brB_" + brID + "' type='number' /></td>";
            rowB += "<td><input class='tc' id='brC_" + brID + "' type='number' /></td>";
            rowB += "<td><input class='tc' id='brT_" + brID + "' type='number' /></td>";
            rowB += "<td><input class='tc' id='brRem_" + brID + "' type='text' /></td></tr>";
        }
    }
    rowB += "</table>";
    $("#breakerBlock").html(rowB);


    //$(".txtlo1").css("display", "inline-block").css("padding", "0 5px 0 0");
    //$(".txtlo2").css("display", "inline-block").css("padding", "0 5px 0 10px");
    //$(".tc").css("width", "100px");
    
}

function buildSwitchPODForm(src, id, x, b) {
    if ($("#regs").hasClass("bdr")) {
        $("#regs").css("visibility", "hidden").css("height", 0).removeClass("bdr");
    }

    if (src == "SWI") {
        for (var a = 0; a < x.length; a++) {
            if (x[a].split("|")[0] === id) {
                var str = "<label class='txtlo1'>Station Number: </label><label class='txtlo1' id='xfrmr'>" + "<b>" + x[a].split("|")[1].toString() + "</b>" + "</label>  Station Battery:</label><input class='input1' type='number' id='StationBattery' />";
                str += "<label id='lbl9'>Remarks:</label><input style='width:99%;' type='text' id='xremarks' />";
                $("#sourceBlock").html(str);
                break;
            }
        }
    }
    else if (src == "POD") {
        for (var a = 0; a < x.length; a++) {
            if (x[a].split("|")[0] === id) {
                var str = "<div><label class='txtlo1'>Transformer: </label><label class='txtlo1' id='xfrmr'>" + "<b>" + x[a].split("|")[1].toString() + "</b>" + "</label></div>";
                str += "<label class='txtlo1'>Kwh Index:</label><input class='input1' type='number' id='podxfrmrKI' />";
                str += "<label class='txtlo2'>kW Demand Index:</label><input class='input1' type='number' id='podxfrmrDI' />";
                str += "<label class='txtlo2'>Station Battery:</label><input class='input1' type='number' id='podxfrmrBATT' />";
                str += "<div><label class='txtlo1'>Pressure:</label><input class='input1' type='number' id='podxfrmrP' />";
                str += "<label class='txtlo2'>Liquid Temp(C°):</label><input class='input1' type='number' id='podxfrmrLT' />";
                str += "<label class='txtlo2'>N2(lbs):</label><input class='input1' type='number' id='podxfrmrN2' /></div>";
                str += "<div><label class='txtlo1'>Top Oil Temp High:</label><input class='input1' type='number' id='podxfrmrTOTH' />";
                str += "<label class='txtlo2'>Top Oil Temp Current:</label><input class='input1' type='number' id='podxfrmrTOTC' /></div>";
                str += "<div><label class='txtlo1'>Winding HV High:</label><input class='input1' type='number' id='podxfrmrWHVH' />";
                str += "<label class='txtlo2'>Winding HV Current:</label><input class='input1' type='number' id='podxfrmrWHVC' /></div>";
                str += "<div><label class='txtlo1'>Winding LV High:</label><input class='input1' type='number' id='podxfrmrWLVH' />";
                str += "<label class='txtlo2'>Winding LV Current:</label><input class='input1' type='number' id='podxfrmrWLVC' /></div>";
                str += "<div><label class='txtlo1'>Winding TV High:</label><input class='input1' type='number' id='podxfrmrWTVH' />";
                str += "<label class='txtlo2'>Winding TV Current:</label><input class='input1' type='number' id='podxfrmrWTVC' /></div>";
                str += "<label id='lbl9'>Remarks:</label><input style='width:99%;' type='text' id='podxfrmrRemarks' />";
                $("#sourceBlock").html(str);
                break;
            }
        }
    }

    var rowB = "<table><tr><td>Breaker</td><td class='tc1'>Counter</td><td class='tc1'>FS-6</td><td class='tc2'>Remarks</td></tr>"
    for (var a = 0; a < b.length; a++) {
        if (b[a].split("|")[0] === id) {
            var brID = b[a].split("|")[1].toString();
            rowB += "<tr><td>" + "<b>" + brID + "</b>" + "</td>";
            rowB += "<td><input class='tc1' id='regC_" + brID.replace(/ /g, "").toString() + "' type='number' /></td>";
            rowB += "<td><input class='tc1' id='regRV_" + brID.replace(/ /g, "").toString() + "' type='number' /></td>";
            rowB += "<td><input class='tc2' id='brRem_" + brID.replace(/ /g, "").toString() + "' type='text' /></td></tr>";
        }
    }
    rowB += "</table>";
    $("#breakerBlock").html(rowB);
}

function cancel() {
    if (navigator.notification != undefined) {
        navigator.notification.alert("Are you sure you want to cancel inspection?", cancelBtn, "Station Inspection", "No","Yes");
    }
    else {
        alert("Are you sure you want to cancel inspection!");
        clearInspectionForm();
        changePage('page1');
    }
}

function cancelBtn(button) {
    if (button == 2) {
        clearInspectionForm();
        changePage('page1');
    }
    else if (button == 1) {

    }
}

function clearInspectionForm() {
    $("#select-station").val("-1").change();
    $("body").pagecontainer("change", "#page1");
    checkForSync();
    $("input").each(function (i) {
        $(this).val("");
    });

    for (i = 0; i < checkList.length; i++) {
        $("#select-" + checkList[i]).val("-1").change();
    }
}

function checkForSync() {
    if (localStorage.getItem("allInspections") != "" && localStorage.getItem("allInspections") != null) {
        $("#syncBtn").css("visibility", "visible");
        if (navigator.onLine) {
            var ai = JSON.parse(localStorage.getItem("allInspections"));
            $("#syncBtn").html("Sync Inspections (" + ai.length + ")");
            $("#syncBtn").css("background-color", "orange");
        }
        else {
            $("#syncBtn").css("background-color", "red");
        }
    }
    else {
        $("#syncBtn").css("visibility", "hidden");
    }
}

function save() {
    var inpsection, xfrmrStr = [], regStr = [], brkerStr = [];
    var id = $('#select-station').val();
    var dt = Date.now();

    if (inspectionType == "SUB") {
        var _xfrmr = {
            "TYPE": "SUB",
            "INSPECTOR": localStorage.getItem("fcemcStation_uname"),
            "DATE": dt,
            "SID": id,
            "XFRMR": $("#xfrmr").text(),
            "RATING": $("#rating").text(),
            "DV": $("#kWDemandValue").val(),
            "UV": $("#KwhUseValue").val(),
            "BATT": $("#StationBattery").val(),
            "TH": $("#WindTempHigh").val(),
            "TN": $("#WindTempNow").val(),
            "PR": $("#Pressure").val(),
            "LT": $("#LiquidTemp").val(),
            "N2": $("#N2").val(),
            "RE": $("#xremarks").val(),
        };
        xfrmrStr.push(_xfrmr);

        $('#regBlock tbody tr:gt(0)').each(function () {
            var _regStr = {
                "INSPECTOR": localStorage.getItem("fcemcStation_uname"),
                "DATE": dt,
                "SID": id,
                "REGID": $(this).text(),
                "READ": $("#regC_" + $(this).text()).val(),
                "MR": $("#regMR_" + $(this).text()).val(),
                "ML": $("#regML_" + $(this).text()).val(),
                "UV": $("#regUV_" + $(this).text()).val(),
                "RV": $("#regRV_" + $(this).text()).val(),
                "RE": $("#regRem_" + $(this).text()).val()
            };
            regStr.push(_regStr);
        });

        $('#breakerBlock tbody tr:gt(0)').each(function () {
            var _brkerStr = {
                "INSPECTOR": localStorage.getItem("fcemcStation_uname"),
                "DATE": dt,
                "SID": id,
                "BRID": $(this).text(),
                "BV": $("#brBV_" + $(this).text()).val(),
                "A_READ": $("#brA_" + $(this).text()).val(),
                "B_READ": $("#brB_" + $(this).text()).val(),
                "C_READ": $("#brC_" + $(this).text()).val(),
                "T": $("#brT_" + $(this).text()).val(),
                "RE": $("#brRem_" + $(this).text()).val()
            };
            brkerStr.push(_brkerStr);
        });
    }
    else if (inspectionType == "POD" || inspectionType == "SWI") {
        if (inspectionType == "POD") {
            var _xfrmr = {
                "TYPE": "POD",
                "INSPECTOR": localStorage.getItem("fcemcStation_uname"),
                "DATE": dt,
                "SID": id,
                "XFRMR": $("#xfrmr").text(),
                "KI": $("#podxfrmrKI").val(),
                "DI": $("#podxfrmrDI").val(),
                "BATT": $("#podxfrmrBATT").val(),
                "PR": $("#podxfrmrP").val(),
                "LT": $("#podxfrmrLT").val(),
                "N2": $("#podxfrmrN2").val(),
                "TOT_H": $("#podxfrmrTOTH").val(),
                "TOT_C": $("#podxfrmrTOTC").val(),
                "WHV_H": $("#podxfrmrWHVH").val(),
                "WHV_C": $("#podxfrmrWHVC").val(),
                "WLV_H": $("#podxfrmrWLVH").val(),
                "WLV_C": $("#podxfrmrWLVC").val(),
                "WTV_H": $("#podxfrmrWTVH").val(),
                "WTV_C": $("#podxfrmrWTVC").val(),
                "RE": $("#podxfrmrRemarks").val()
            };
            xfrmrStr.push(_xfrmr);
        }
        else if (inspectionType == "SWI") {
            var _xfrmrStr = {
                "TYPE": "SWI",
                "INSPECTOR": localStorage.getItem("fcemcStation_uname"),
                "DATE": dt,
                "SID": id,
                "XFRMR": $("#xfrmr").text(),
                "BATT": $("#StationBattery").val(),
                "RE": $("#xremarks").val()
            };
            xfrmrStr.push(_xfrmrStr);
        }

        $('#breakerBlock tbody tr:gt(0)').each(function () {
            var _brkerStr = {
                "INSPECTOR": localStorage.getItem("fcemcStation_uname"),
                "DATE": dt,
                "SID": id,
                "BRID": $(this).text(),
                "READ": $("#regC_" + $(this).text().replace(/ /g, "").toString()).val(),
                "FS6": $("#regRV_" + $(this).text().replace(/ /g, "").toString()).val(),
                "RE": $("#brRem_" + $(this).text().replace(/ /g, "").toString()).val()
            };
            brkerStr.push(_brkerStr);
        });
    }

    var cklistComplete = true;
    for (i = 0; i < checkList.length; i++) {
        if ($("#select-" + checkList[i]).val() == -1) {
            cklistComplete = false;
            break;
        }
    }

    if (cklistComplete) {
        inpsection = {
            "stationXfrmr": xfrmrStr,
            "stationRegulator": regStr,
            "stationBreaker": brkerStr,
            "stationChecklist": getChecklist(id)
        };

        if (navigator.onLine) {
            //sendInspection(inpsection);
            storeInspection(inpsection);  //test store loacally
        }
        else {
            storeInspection(inpsection);
            if (navigator.notification != undefined) {
                navigator.notification.alert("Offline -Inspection Stored Locally! Sync next time connected to network!", fakeCallback, "Network Issue", "Ok");
            }
            else {
                alert("Offline -Inspection Stored Locally! Sync next time connected to network!");
            }
        }
    }
    else {
        inpsection = {}, xfrmrStr = [], regStr = [], brkerStr = [], ckList = "";
        if (navigator.notification != undefined) {
            navigator.notification.alert("Form Incomplete!", fakeCallback, "Form Issue", "Ok");
        }
        else {
            alert("Form Incomplet!");
        }
    }
}

function syncInspections() {
    if (navigator.onLine) {
        if (localStorage.getItem("allInspections") != "") {
            var records = JSON.parse(localStorage.getItem("allInspections"));
            for (var i = 0; i < records.length; i++) {
                sendInspectionSync(records[i]);             
            }
        }
    }
    else {
        if (navigator.notification != undefined) {
            navigator.notification.alert("Offline - Not connected to network!", fakeCallback, "Network Issue", "Ok");
        }
        else {
            alert("Offline - Not connected to network!");
        }
    }
}

function storeInspection(record) {
    var existingInspections = null;
    if (localStorage.getItem("allInspections") != "") {
        var existingInspections = JSON.parse(localStorage.getItem("allInspections"));
    }
    if (existingInspections == null) existingInspections = [];
    existingInspections.push(record);
    localStorage.setItem("allInspections", JSON.stringify(existingInspections));
    clearInspectionForm();
}

function sendInspection(_data) {
    try {
        $.ajax({
            type: "POST",
            url: svcUrl + "STATIONINSPECTION",
            //url: "http://localhost:58978/ServiceTest.svc/STATIONINSPECTION",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(_data),
            cache: false,
            beforeSend: function () {
                $("#spinCont").show();
            },
            success: function (result) {
                var r = result;
            },
            complete: function () {
                $("#spinCont").hide();
                clearInspectionForm();
            },
            error: function (textStatus, errorThrown) {
                var txt = textStatus;
                var et = errorThrown;
            }
        });
    }
    catch (ex) {
        if (navigator.notification != undefined) {
            navigator.notification.alert("Unalbe to send station inspection: " + ex.message.toString(), fakeCallback, "Network Issue", "Ok");
        }
        else {
            alert("Unalbe to update stations: " + ex.message.toString());
        }
    }
}

function sendInspectionSync(_data) {
    try {
        $.ajax({
            type: "POST",            
            url: svcUrl + "STATIONINSPECTION",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(_data),
            cache: false,
            beforeSend: function () {
                $("#spinCont").show();
            },
            success: function (result) {
                if (result == "true") {
                    localStorage.setItem("allInspections", "");
                }
            },
            complete: function () {
                $("#spinCont").hide();
                checkForSync();
            },
            error: function (textStatus, errorThrown) {
                var txt = textStatus;
                var et = errorThrown;
            }
        });
    }
    catch (ex) {
        alert(ex.message.toString());
        if (navigator.notification != undefined) {
            navigator.notification.alert("Unalbe to send station inspection: " + ex.message.toString(), fakeCallback, "Network Issue", "Ok");
        }
        else {
            alert("Unalbe to update stations: " + ex.message.toString());
        }
    }
}

function getChecklist(sid) {
    var dt = Date.now();
    var ckList = {
        "INSPECTOR": localStorage.getItem("fcemcStation_uname"),
        "DATE": dt,
        "SID": sid,
        "CL_1": $("#select-1").val(),
        "CL_2": $("#select-2").val(),
        "CL_4": $("#select-4").val(),
        "CL_5": $("#select-5").val(),
        "CL_6a": $("#select-6a").val(),
        "CL_6b": $("#select-6b").val(),
        "CL_6c": $("#select-6c").val(),
        "CL_6d": $("#select-6d").val(),
        "CL_7": $("#select-7").val(),
        "CL_8": $("#select-8").val(),
        "CL_9": $("#select-9").val(),
        "CL_10": $("#select-10").val(),
        "CL_11": $("#select-11").val(),
        "CL_12": $("#select-12").val(),
        "CL_13": $("#select-13").val(),
        "CL_14": $("#select-14").val(),
        "CL_15": $("#select-15").val(),
        "CL_16": $("#select-16").val(),
        "CL_17": $("#select-17").val(),
        "CL_18": $("#select-18").val(),
        "CL_19": $("#select-19").val(),
        "CL_20": $("#select-20").val(),
        "CL_20a": $("#select-20a").val(),
        "CL_20b": $("#select-20b").val(),
        "CL_20c": $("#select-20c").val(),
        "CL_20d": $("#select-20d").val(),
        "CL_20e": $("#select-20e").val(),
        "CL_20f": $("#select-20f").val(),
        "CL_20g": $("#select-20g").val(),
        "CL_21": $("#select-21").val(),
        "CL_22": $("#select-22").val(),
        "CL_23": $("#select-23").val(),
        "CL_24": $("#select-24").val(),
        "CL_25": $("#select-25").val(),
        "CL_26": $("#select-26").val(),
        "CL_27": $("#select-27").val(),
        "CL_28": $("#select-28").val()        
    };

    return ckList;
}
//endregion

//region History
function getHistory() {
    if (navigator.onLine) {
        var stationId = $('#select-station').val();
        if (stationId != -1) {
            changePage('histInspectionPage');
            var stationName = $('#select-station').find(":selected").text();
            $("#histStationName").text(stationName);
            popHistSelection(stationId);
        }
        else if (stationId == -1) {
            if (navigator.notification != undefined) {
                navigator.notification.alert("No station selected!", fakeCallback, "Station Selection", "Ok");
            }
            else {
                alert("No station selected!");
            }
        }
    }
    else {
        if (navigator.notification.confirm("No network connection detected, check settings and try again!", networkIssue, "Please Confirm:", "Cancel, Ok")) {
            
        }        
        else {
            alert("No network connection detected, check settings and try again!");
        }
    }
}

function popHistSelection(id) {
    var type = getType(id, "");
    $("#select-rHist").empty();

    var sr = JSON.parse(localStorage.getItem("station_regulators"));
    var intVsr = 0;
    for (f = 0; f < sr.length; f++) {
        if (sr[f].split("|")[0] == id) {
            $('#select-rHist').append($('<option/>', { value: intVsr, text: sr[f].split("|")[1] }));
            intVsr += 1;
        }
    }
    $("#select-rHist").val("0").change();

    $("#select-bHist").empty();
    var sb = JSON.parse(localStorage.getItem("station_breakers"));
    var intVsb = 0;
    for (e = 0; e < sb.length; e++) {
        if (sb[e].split("|")[0] == id) {
            $('#select-bHist').append($('<option/>', { value: intVsb, text: sb[e].split("|")[1] }));
            intVsb += 1;
        }
    }
    $("#select-bHist").val("0").change();

    switch (type) {
        case "SUB":
            fetchSubHistory(id);
            break;
        case "POD":
            $("#regsHist").css("visibility", "hidden").css("height", "0");
            fetchPodHistory(id);
            break;
        case "SWI":
            $("#regsHist").css("visibility", "hidden").css("height", "0");
            fetchSwiHistory(id);
            break;
    }
}

function fetchSubHistory(id) {
    $.ajax({
        type: "GET",
        url: svcUrl + "SUBHIST/" + id,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: false,
        beforeSend: function () {
            $("#spinCont").show();
        },
        success: function (results) {
            getSubXfrmrHist(results.SUBHISTResult.stationXfrmr);
            regHistData = results.SUBHISTResult.stationRegulator;
            brkrHistData = results.SUBHISTResult.stationBreaker;

            getSubRegHist($("#select-rHist option:selected").text());
            getSubBrkrHist($("#select-bHist option:selected").text());
        },
        complete: function () {
            $("#spinCont").hide();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (navigator.notification != undefined) {
                navigator.notification.alert("Unalbe to get station history: " + errorThrown.toString(), fakeCallback, "Network Issue", "Ok");
            }
            else {
                alert("Unalbe to get station history: " + errorThrown.toString());
            }
        }
    });
}

function getSubXfrmrHist(reX) {
    var data = [];
    var c = [];
    for (var i = 0; i < reX.length; i++) {
        data.push({ DATE: reX[i].DATE.trim(), RATING: reX[i].RATING.trim(), "kW DEMAND": reX[i].DV.trim(), "KwH USE": reX[i].UV.trim(), "TEMP HI": reX[i].TH.trim(), "TEMP NOW": reX[i].TN.trim(), PRESSURE: reX[i].PR.trim(), "LIQUID TEMP": reX[i].LT.trim(), "N2(lbs)": reX[i].N2.trim(), BATTERY: reX[i].BATT.trim(), INSPECTOR: reX[i].INSPECTOR.trim(), REMARK: reX[i].REMARK.trim() });
    }
    $("#xHistTable").wijgrid({ data: data });
}

function getSubRegHist(id) {
    $("#rHistTable").html("");
    var data = [];
    for (var b = 0; b < regHistData.length; b++) {
        if (regHistData[b].REGID == id) {
            data.push({ DATE: regHistData[b].DATE, "READING": regHistData[b].READ, "OPS": regHistData[b].OPS, "MAX RAISE": regHistData[b].MR, "MAX LOWER": regHistData[b].ML, "UNREG VOLT OUT": regHistData[b].UV, "REG VOLT OUT": regHistData[b].RV, INSPECTOR: regHistData[b].INSPECTOR, REMARK: regHistData[b].REMARK });
        }
    }
    $("#rHistTable").wijgrid({ data: data });
}

function getSubBrkrHist(id) {
    $("#bHistTable").html("");
    var data = [];
    for (var b = 0; b < brkrHistData.length; b++) {
        if (brkrHistData[b].BRID == id) {
            data.push({ DATE: brkrHistData[b].DATE, "A READ": brkrHistData[b].A, "A OPS": brkrHistData[b].A_OPS, "B READ": brkrHistData[b].B, "B OPS": brkrHistData[b].B_OPS, "C READ": brkrHistData[b].C, "C OPS": brkrHistData[b].C_OPS, "TOTAL OPS": brkrHistData[b].T, "VOLTAGE": brkrHistData[b].BV, INSPECTOR: brkrHistData[b].INSPECTOR, REMARKS: brkrHistData[b].REMARK });
        }
    }
    $("#bHistTable").wijgrid({ data: data });
}

function fetchPodHistory(id) {
    $.ajax({
        type: "GET",
        url: svcUrl + "PODHIST/" + id,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: false,
        beforeSend: function () {
            $("#spinCont").show();
        },
        success: function (results) {
            getPodXfrmrHist(results.PODHISTResult.stationXfrmrPod);
            brkrHistData = results.PODHISTResult.stationBreaker;

            getPodbBrkrHist($("#select-bHist option:selected").text());
        },
        complete: function () {
            $("#spinCont").hide();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (navigator.notification != undefined) {
                navigator.notification.alert("Unalbe to get station history: " + errorThrown.toString(), fakeCallback, "Network Issue", "Ok");
            }
            else {
                alert("Unalbe to get station history: " + errorThrown.toString());
            }
        }
    });
}

function getPodXfrmrHist(reX) {
    var data = [];
    var c = [];
    for (var i = 0; i < reX.length; i++) {
        data.push({
            DATE: reX[i].DATE.trim(),
            "kW DEMAND": reX[i].DI.trim(),
            "KwH USE": reX[i].KI.trim(),
            BATTERY: reX[i].BATT.trim(),
            PRESSURE: reX[i].PR.trim(),
            "LIQUID TEMP": reX[i].LT.trim(),
            "N2(lbs)": reX[i].N2.trim(),
            "Top Oil Temp High": reX[i].TOT_H.trim(),
            "Top Oil Temp Current:": reX[i].TOT_C.trim(),
            "Winding HV High": reX[i].WHV_H.trim(),
            "Winding HV Current": reX[i].WHV_C.trim(),
            "Winding LV High": reX[i].WLV_H.trim(),
            "Winding LV Current": reX[i].WLV_C.trim(),
            "Winding TV High": reX[i].WTV_H.trim(),
            "Winding TV Current": reX[i].WTV_C.trim(),
            INSPECTOR: reX[i].INSPECTOR.trim(),
            REMARK: reX[i].REMARK.trim()
        });
    }
    $("#xHistTable").wijgrid({ data: data });
}

function getPodbBrkrHist(id) {
    $("#bHistTable").html("");
    var data = [];
    for (var b = 0; b < brkrHistData.length; b++) {
        if (brkrHistData[b].BRID == id) {
            data.push({
                DATE: brkrHistData[b].DATE,
                "Counter Read": brkrHistData[b].A_READ,
                "Total Read": brkrHistData[b].A_OPS,
                FS6: brkrHistData[b].FS6,
                "FS6 Ops": brkrHistData[b].B_OPS,
                INSPECTOR: brkrHistData[b].INSPECTOR,
                REMARK: brkrHistData[b].REMARK
            });
       }
    }
    $("#bHistTable").wijgrid({ data: data });
}

function fetchSwiHistory(id) {
    $.ajax({
        type: "GET",
        url: svcUrl + "SWIHIST/" + id,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: false,
        beforeSend: function () {
            $("#spinCont").show();
        },
        success: function (results) {
            getSwiXfrmrHist(results.SWIHISTResult.stationXfrmrSwi);
            brkrHistData = results.SWIHISTResult.stationBreaker;

            getPodbBrkrHist($("#select-bHist option:selected").text());
        },
        complete: function () {
            $("#spinCont").hide();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (navigator.notification != undefined) {
                navigator.notification.alert("Unalbe to get station history: " + errorThrown.toString(), fakeCallback, "Network Issue", "Ok");
            }
            else {
                alert("Unalbe to get station history: " + errorThrown.toString());
            }
        }
    });
}

function getSwiXfrmrHist(reX) {
    var data = [];
    var c = [];
    for (var i = 0; i < reX.length; i++) {
        data.push({
            DATE: reX[i].DATE.trim(),
            BATTERY: reX[i].BATT.trim(),
            INSPECTOR: reX[i].INSPECTOR.trim(),
            REMARK: reX[i].REMARK.trim()
        });
    }
    $("#xHistTable").wijgrid({ data: data });
}

function clearHistForm() {
    $("#select-station").val("-1").change();
    $("#regsHist").css("visibility", "").css("height","");
    regHistData = "";
    brkrHistData = "";
}

//endregion

function popForm() {
    var one = 1;    
    $("#formInputs input").each(function () {
        $(this).val(one += 1);
    });
    
    for (i = 0; i < checkList.length; i++) {
        $("#select-" + checkList[i]).val("1").change();
    }
}