var map;
var obj;
var myheader;
var mydesc;
var mydatatable;
var wdofficer;
var wdaddress;
var wdhead;
var compochk;

var url = "/admin/citymapdisplay";

var arr = [];
var chkdata = {}
var glob_polygon;
var removeIndi;
var modelsection;
var global_slum_id;
// $(document).ready(function(){
// 	initMap12();
// });
function initMap12() {
	labelmap();
	map = new google.maps.Map(document.getElementById('map12'), {
		center : {
			lat : 19.489339,
			lng : 74.631617
		},
		zoom : 4,
		mapTypeId : 'satellite',
	});

	myheader = $("#maphead");
	mydesc = $("#mapdesc");
	wdaddress = $("#wdaddress");
	wdofficer = $("#wdofficer");
	wdhead = $("#wdhead");
	compochk = $("#compochk");

	loadcity();
	viewIndiaBorder();
	modelsection = {
		"General information" : "General",
		"Toilet information" : "Toilet",
		"Water information" : "Water",
		"Waste management information" : "Waste",
		"Drainage information" : "Drainage",
		"Road & access information" : "Road",
		"Gutter information" : "Gutter"
	}
}
function animateMapZoomTo(map, targetZoom) {
    var currentZoom = arguments[2] || map.getZoom();
    if (currentZoom != targetZoom) {
        google.maps.event.addListenerOnce(map, 'zoom_changed', function (event) {
            animateMapZoomTo(map, targetZoom, currentZoom + (targetZoom > currentZoom ? 1 : -1));
        });
        setTimeout(function(){ map.setZoom(currentZoom) }, 80);
    }
}
var slum_list = function slum_list(val){
	//mydatatable.on("click", "span", function(e) {
		data = $(val).attr("data");
		arr_data = data.split(":");
		$.each(arr_data, function(k, v) {
			if (arr.indexOf(v) == -1)
				  arr.push(v);
		});
		slum_pop = arr.pop();
		arr.push(slum_pop);
		createMap(slum_pop, false);
		//e.stopPropagation();
	//});
}
function initMap(obj1, zoomlavel) {

	map = new google.maps.Map(document.getElementById('map12'), {

		zoom : zoomlavel,
		mapTypeId : 'satellite',
	});
	getcordinates(obj1);

}

function loadcity() {

	$(".overlay").show();
	$.ajax({
		url : url,
		type : "GET",
		contenttype : "json",
		success : function(json) {
			obj = json;
			loadslum();
			getcordinates(obj);
		}
	});
}

function loadslum() {
	var arr_slum_url = [];
	//$(".overlay").show();
	$.each(obj, function(k, v) {
		arr_slum_url.push($.ajax({
			url : "/admin/slummapdisplay/" + v.id + "/",
			type : "GET",
			contenttype : "json",
			success : function(json) {
				obj[k]["content"] = json["content"];
			}
		}));
	});
	Promise.all(arr_slum_url).then(function(result) {
		$(".overlay").hide();
		setTimeout(function(){
			animateMapZoomTo(map,8);
		},40);

	});

}

function getcordinates(obj1, flag=true) {

	for (var key in obj1) {
		try {
			latlongformat(obj1[key]['lat'], obj1[key]['name'], obj1[key]['bgColor'], obj1[key]['borderColor'], flag);
		} catch(err) {
			latlongformat(obj1['lat'], obj1['name'], obj1['bgColor'], obj1['borderColor'], flag);
			break;
		}
	}

}
function factsheet_click(obj){
	  $(".overlay").show();
		var Sid = global_slum_id;
		var url = "/admin/rimreportgenerate/";
    var Fid = "154";
		$.ajax({
			url : url,
			data : { Sid : Sid,Fid : Fid},
			type: "POST",
			contenttype : "json",
			success : function(json){
					url = json.string;
					$(".overlay").hide();
					window.open("" + url );
			}
		});
}
function familyfactsheet_click(slum, house){
	$(".overlay").show();
	$.ajax({
	url : '/admin/familyrportgenerate/',
	data : { Sid : slum, HouseNo : house},
	type: "POST",
	contenttype : "json",
	success : function(json){
		  $(".overlay").hide();
			if (json['string']!=undefined){
			url = json.string;
			window.open("" + url );
		}
		else{
			alert(json['error']);
		}
	},
	error:function(){
		$(".overlay").hide();
	}
});
}
function latlongformat(ShapeValue, shapename, bgcolor, bordercolor, flag=true) {

	var PolygonPoints = [];
	var centerlatlang = [];
	var bounds = new google.maps.LatLngBounds();
	var result = ShapeValue.substring(20, ShapeValue.length - 2);
	var array = result.split(/[\s,]+/);
	var result1;
	var result2;

	for (var i = 0; i <= array.length - 1; i++) {
		if (i % 2 == 0) {
			result1 = array[i];
		} else if (i % 2 != 0) {
			result2 = array[i];
			PolygonPoints.push(new google.maps.LatLng(result2, result1));
			bounds.extend(new google.maps.LatLng(result2, result1));
		}
	}

	PolygonPoints.pop();

	if (bgcolor == undefined) {
		bgcolor = "";
		bordercolor = "";
	}
	var Poly1;
	if(flag){
	 Poly1 = drawPolygon(PolygonPoints, bounds, bgcolor, bordercolor);
}
else{
	 Poly1 = drawPolygon(PolygonPoints, bounds, bgcolor, bordercolor, 99);
}
	glob_polygon = Poly1;
	var options = {
				map: map,
				position: bounds.getCenter(),
				text: '',
				minZoom: 7,
				zIndex : 999
			};
	var slumLabel = new MapLabel(options);
	if (arr.length == 0) {
		slumLabel.text = shapename;
		slumLabel.changed('text');
	}
	else{
				//slumLabel.changed('text');
			google.maps.event.addListener(Poly1, 'mouseover', function(event) {
		    slumLabel.text = shapename;
		    slumLabel.changed('text');
		  });
		  google.maps.event.addListener(Poly1, 'mouseout', function(event) {
		    slumLabel.text = '';
		    slumLabel.changed('text');
			});
		}
	var infoWindowover = new google.maps.InfoWindow;
	// Events on Polygon
	// google.maps.event.addListener(Poly1, 'mouseover', function(event) {
	// 	infoWindowover.setContent(shapename);
	// 	infoWindowover.setPosition(bounds.getCenter());
	// 	infoWindowover.open(map);
	//
	// });
	//
	// google.maps.event.addListener(Poly1, 'mouseout', function(event) {
	// 	infoWindowover.close();
	// });

	var indiWindow = true;

	/*if (arr.length == 4){
	 alert("hello");
	 console.log(obj[arr[0]]["content"][arr[1]]["content"][arr[2]]["content"][arr[3]]['info']);
	 }*/
  if(flag){
	google.maps.event.addListener(Poly1, 'click', function(event) {
		infoWindowover.close();

		if (arr.length == 4) {
			if (indiWindow == true) {
				var contentString = '<div id="content" >' + '<div id="bodyContent">' + '<p><b>' + shapename + '</b></p>' + '<div class="row">' + '<div class="col-md-12">' + '<p>' + obj[arr[0]]["content"][arr[1]]["content"][arr[2]]["content"][arr[3]]['info'] + '</p> ';
				//if (obj[arr[0]]["content"][arr[1]]["content"][arr[2]]["content"][arr[3]]['factsheet']) {
					contentString += '<p><a href="javascript:factsheet_click(this)">Factsheet</a></p>';
				//}
				contentString +='</div>' + '</div>';

				var infoWindow = new google.maps.InfoWindow({
					maxWidth : 430
				});
				infoWindow.setContent(contentString);
				infoWindow.setPosition(event.latLng);
				infoWindow.open(map);

				indiWindow = false;
			}

		} else {

			createMap(shapename, false);
		}
	});
 }
 else{
	 //Poly1.setZIndex(99);
	 google.maps.event.addListener(Poly1, 'click', function(event) {
		 $("#datatable_filter").find("input").val(shapename);
		 $("#datatable_filter").find("input").trigger('keyup');
		  $("#datatable").find('tbody>tr>td>div>span:contains('+shapename+')').trigger('click');
	 });
 }

}
var slum_list_data = [];
function fetchSlum(obj1) {
	$.each(obj1, function(index, val) {
		if (val['content']!=undefined){
				fetchSlum(val['content']);
			}
		else {
				slum_list_data.push(val);
		}
	});
	return slum_list_data
}

function createMap(jsondata, arrRemoveInd) {
	var wdname = "";
	var wdadd = "";
	var head = "";
	compochk.html('');

	if (arrRemoveInd == true) {
		if (arr.indexOf(jsondata) > -1 == true) {
			var indi = arr.indexOf(jsondata);
			arr.splice(removeIndi, 4);
		}
	} else {
		if (arr.indexOf(jsondata) > -1 == false) {
			arr.push(jsondata);
		}
	}

	if ($.isEmptyObject(obj[arr[0]]["content"])) {
		return;
	}

	data = fetchData(obj);
	myheader.html('<h4>' + jsondata + '</h4>');
	setMaplink();
	drawDatatable();
	if (arr.length == 1) {
		mydesc.html(obj[arr[0]]['info']);
		myheader.html('');
		mydesc.html('');
		initMap(data, 11);
		slum_list_data=[];
		var slumdataonly = fetchSlum(data);
		getcordinates(slumdataonly, false);
	} else if (arr.length == 2) {
		mydesc.html(obj[arr[0]]["content"][arr[1]]['info']);

		wdadd = "<div class='row'><div  class='col-md-2' style='margin-left:25px'><b>Address :</b> </div><div class='col-md-9'>";
		if (obj[arr[0]]["content"][arr[1]]['wardOfficeAddress']) {
			wdadd += (obj[arr[0]]["content"][arr[1]]['wardOfficeAddress']).trim();
		} else {
			wdadd += " - ";
		}
		wdadd += "</div></div>";

		wdname = "<div class='row'><div class='row' style='margin-left:25px'><div class='col-md-2' ><b>Name :</b></div><div class='col-md-10'> ";
		if (obj[arr[0]]["content"][arr[1]]['wardOfficerName']) {
			wdname += obj[arr[0]]["content"][arr[1]]['wardOfficerName'];
		} else {
			wdname += " - ";
		}
		wdname += "</div></div>" + "<div class='row' style='margin-left:25px'><div class='col-md-2' ><b> Contact :</b></div><div class='col-md-10'> ";
		if (obj[arr[0]]["content"][arr[1]]['wardOfficeTel']) {
			wdname += obj[arr[0]]["content"][arr[1]]['wardOfficeTel'];
		} else {
			wdname += " - ";
		}
		wdname += "</div></div></div>";

		head = "<div><b>Administrative Ward : </b></div>";

		initMap(data, 12);
		slum_list_data=[];
		var slumdataonly = fetchSlum(data);
		getcordinates(slumdataonly, false);
	} else if (arr.length == 3) {
		mydesc.html(obj[arr[0]]["content"][arr[1]]["content"][arr[2]]['info']);

		wdadd = "<div class='row'><div  class='col-md-2' style='margin-left:25px'><b>Address :</b> </div><div class='col-md-9'>";
		if (obj[arr[0]]["content"][arr[1]]["content"][arr[2]]['wardOfficeAddress']) {
			wdadd += (obj[arr[0]]["content"][arr[1]]["content"][arr[2]]['wardOfficeAddress']).trim();
		} else {
			wdadd += " - ";
		}
		wdadd += "</div></div>";

		wdname = "<div class='row'><div class='row' style='margin-left:25px'><div class='col-md-2' ><b>Name :</b></div><div class='col-md-10'> ";
		if (obj[arr[0]]["content"][arr[1]]["content"][arr[2]]['wardOfficerName']) {
			wdname += obj[arr[0]]["content"][arr[1]]["content"][arr[2]]['wardOfficerName'];
		} else {
			wdname += " - ";
		}
		wdname = "</div></div>" + "<div class='row' style='margin-left:25px'><div class='col-md-2' ><b> Contact :</b></div><div class='col-md-10'> ";
		if (obj[arr[0]]["content"][arr[1]]["content"][arr[2]]['wardOfficeTel']) {
			wdname += obj[arr[0]]["content"][arr[1]]["content"][arr[2]]['wardOfficeTel'];
		} else {
			wdname += " - ";
		}
		wdname += "</div></div></div>";

		head = "<div><b>Electoral Ward : </b></div>";

		val = obj[arr[0]]["content"][arr[1]]["content"][arr[2]]
		initMap(val, 13);
		getcordinates(data);

	} else if (arr.length == 4) {
		mydesc.html(obj[arr[0]]["content"][arr[1]]["content"][arr[2]]["content"][arr[3]]['info'] +"<br/><div style='padding-top:10px;'><a style='font-weight:bold;text-decoration: underline;cursor:pointer;' href='javascript:factsheet_click(this)'>View Factsheet</a></div>");
		val = obj[arr[0]]["content"][arr[1]]["content"][arr[2]]["content"][arr[3]]
		objmap = initMap(val, 18);

		mydatatable.fnDestroy();
		$("#datatable").empty();

		global_slum_id = val['id']
		compo(global_slum_id);
	}
	wdhead.html(head);
	wdaddress.html(wdadd);
	wdofficer.html(wdname);
}

function fetchData(obj) {
	var o = obj;
	$.each(arr, function(index, val) {
		o = o[val]['content'];
	});
	return o
}

function setMaplink() {
	var mydiv = $("#maplink");
	mydiv.html("");
	var aTag = "";
	aTag += '<label id="Home" onclick="getArea(this);">' + " <span style='text-decoration: underline;cursor:pointer;color:blue;'>Home</span></label>&nbsp;&nbsp;";

	if (arr.length > 0) {
		for (var i = 0; i < arr.length; i++) {
			aTag += '>> <label id="' + arr[i] + '" onclick="getArea(this);">' + " <span style='text-decoration: underline;cursor:pointer;color:blue;'>" + arr[i] + "</span></label>&nbsp;&nbsp; ";
		}
	}
	mydiv.html(aTag);
}

function getArea(initlink) {
	removeIndi = "";

	var textelement = (initlink.textContent).toString().trim();

	if (textelement == "Home") {
		arr.splice(0, 4);
		setMaplink();
		initMap(obj, 8);
		viewIndiaBorder();

		wdhead.html('');
		wdaddress.html('');
		wdofficer.html('');
		myheader.html('');
		mydesc.html('');
		compochk.html('');
		$("#datatable").empty();
		$("#datatablecontainer").hide();
		return;
	}

	$("#datatablecontainer").show();
	removeIndi = arr.indexOf(textelement) + 1;
	createMap(textelement, true);
}

function drawPolygon(PolygonPoints, centerlatlang, bgcolor, bordercolor, index=1) {
	var Poly;
	var newbgcolor = "#FFA3A3";
	var newbordercolor = "#FF0000";
	var opacity = 0.4;
	if (bgcolor != undefined && bgcolor != "") {
		newbgcolor = bgcolor;
	}

	if (bordercolor != undefined && bordercolor != "") {
		newbordercolor = bordercolor;
	}

	Poly = new google.maps.Polygon({
		paths : PolygonPoints,
		strokeColor : newbordercolor,
		strokeOpacity : 0.7,
		strokeWeight : 2,
		fillColor : newbgcolor,
		fillOpacity : opacity,
		center : centerlatlang.getCenter(),
		zIndex:index,
	});
	Poly.setMap(map);
	map.setCenter(centerlatlang.getCenter());
	return Poly;
}

var dataset = [];
var a = [];
var stackLegend = [];
function getData(data) {

	$.each(data, function(k, v) {
		if (v.content != undefined) {
			stackLegend.push(k);
			getData(v.content);
			stackLegend.pop();
		} else {
			v['legend'] = stackLegend.join(':')
			a.push(v);
		}

	});
}

var arrr;
function drawDatatable() {
	data = fetchData(obj);
	a = []
	getData(data);
	arrr = a;
	mydatatable = $("#datatable").dataTable({
		"aaData" : arrr,
		"bDestroy" : true,
		"order" : [[0, "asc"]],
		"aoColumns" : [{
			"title" : '<div style="font-size: large;font-weight: 900;">' + "Slums" + '</div>',
			"mDataProp" : "name",
			"mRender" : function(oObj, val, setval) {

				var desc = "";
				if (setval.legend != "")
					desc = ' (' + setval.legend.replace(":", " >> ") + ')';
				return '<div><span onclick="slum_list(this);" style="font-weight: 900;font-size: small;color: blue;cursor: pointer;" name="divSlum" data="' + setval.legend + ":" + setval.name + '">' + setval.name + desc + ' </span></div>' + '<div style="font-size: small;">' + setval.info + '</div>';
			}
		}]
	});
	$("#datatablecontainer").show();

}

function viewIndiaBorder() {
	var layer;
	// Fusion Tables layer
	var tableid = 420419;

	layer = new google.maps.FusionTablesLayer({
		query : {
			select : "kml_4326",
			from : tableid,
			where : "name_0 = 'India'"
		},
		styles : [{
			polygonOptions : {
				strokeWeight : "2",
				strokeColor : "#FF0000",
				strokeOpacity : "0.4",
				fillOpacity : "0.0",
				fillColor : "#000000"
			}
		}]
	});

	layer.setMap(map);
}

function compo(slumId) {
	compochk.html('<div style="height:300px;width:300px;"><div id="loading-img"></div></div>');
	$.ajax({
		url : '/component/get_component/' + slumId,
		type : "GET",
		contenttype : "json",
		success : function(json) {
			viewcompo(json);
		},
		error:function(json){
			compochk.html('');
		}
	});
	$.ajax({
		url : '/component/get_kobo_RIM_data/' + slumId,
		type : "GET",
		contenttype : "json",
		success : function(json) {
			global_RIM = json;
                        //global_RIM['General']['']= arr[0];
                        try{
                        global_RIM['General']['admin_ward']=arr[1];
                        global_RIM['General']['slum_name']=arr[3];
                        }catch(e){}
		}
	});

}

var lst_sponsor = [];
var demovar = {}

function viewcompo(dvalue) {
	str = "";
	counter = 1;

	var chkPoly;

	$.each(dvalue, function(k, v) {
		/*
		 str +='<div name="div_group" class="panel-group panel  panel-default panel-heading"> '
		 +'<input style="font-size:12%;" class="panel-title" name="chk_group"  value="'+ k +'"  >&nbsp;'
		 +'<a name="chk_group" data-toggle="collapse" href="#'+counter+'">'+k+'</a>'
		 +'</input></br>'
		 * */
		counter = counter + 1;
		//chkdata[k]={}
		str += '<div name="div_group" class=" panel  panel-default panel-heading"> ' + '<a name="chk_group" data-toggle="collapse" href="#' + counter + '">' + k + '</a>' + '</br>'

		str += '<div id="' + counter + '" class="panel-collapse collapse">'

		if (k != "Sponsor") {
			/******* code for model ****************/
			str += '<div name="div_group" >' + '&nbsp;&nbsp;&nbsp;' + '<span><a style="cursor:pointer;color:darkred;" selection="' + k + '" onclick="tabularSingleGroup(this);">View Tabular Data</a><span>' + '</div>'
			/********************/
		}
		demovar = v;
		$.each(v, function(k1, v1) {

			var chkcolor = v1['blob']['polycolor'];
			var chklinecolor = v1['blob']['linecolor'];
			var chklinewidth = v1['blob']['linewidth'];

			chkdata[k1] = {}
			str += '<div name="div_group" >' + '&nbsp;&nbsp;&nbsp;' + '<input name="chk1" style="background-color:' + chkcolor + '; -webkit-appearance: none; border: 1px solid black; height: 1.2em; width: 1.2em;" selection="' + k + '" component_type="' + v1['type'] + '" type="checkbox" value="' + k1 + '" onclick="checkSingleGroup(this);" >' + '<a>&nbsp;' + k1 + '</a>&nbsp;(' + v1['child'].length + ')' + '</input>' + '</div>'
			if (v1['type'] == 'C') {
				$.each(v1['child'], function(k2, v2) {

					var house_point = []
					var bounds = new google.maps.LatLngBounds();
					if (v2['shape']['type'] == "LineString") {
						$.each(v2['shape']['coordinates'], function(k3, coordinate) {
							house_point.push(new google.maps.LatLng(coordinate[1], coordinate[0]));
							bounds.extend(new google.maps.LatLng(coordinate[1], coordinate[0]));
						});

						chkPoly = new google.maps.Polyline({
							path : house_point,
							strokeColor : chklinecolor,
							strokeOpacity : 0.8,
							strokeWeight : chklinewidth
							//center : centerlatlang.getCenter()
						});

					} else if (v2['shape']['type'] == "Point") {
						house_point.push(new google.maps.LatLng(v2['shape']['coordinates'][1], v2['shape']['coordinates'][0]));
						bounds.extend(new google.maps.LatLng(v2['shape']['coordinates'][1], v2['shape']['coordinates'][0]));
						var pinImage;
						if (k1 == "Manholes") {
							pinImage = {
								path : google.maps.SymbolPath.CIRCLE,
								scale : 3,
								fillColor : chklinecolor,
								strokeColor : chklinecolor
							}

						} else {
							pinImage = new google.maps.MarkerImage("http://www.googlemapsmarkers.com/v1/" + chklinecolor.substring(1, chklinecolor.length) + "/");

						}

						chkPoly = new google.maps.Marker({
							position : {
								lat : v2['shape']['coordinates'][1],
								lng : v2['shape']['coordinates'][0]
							},
							icon : pinImage,

						});

					} else if (v2['shape']['type'] == "Polygon") {
						$.each(v2['shape']['coordinates'][0], function(k3, coordinate) {
							house_point.push(new google.maps.LatLng(coordinate[1], coordinate[0]));
							bounds.extend(new google.maps.LatLng(coordinate[1], coordinate[0]));
						});

						chkPoly = new google.maps.Polygon({
							paths : house_point,
							strokeColor : chklinecolor,
							strokeOpacity : 0.7,
							strokeWeight : chklinewidth,
							fillColor : chkcolor,
							fillOpacity : 0.6,
							zIndex : -1
							//center : house_point.getCenter()
						});

					}
					//chkPoly.setMap(map);
					if (k1=="Houses"){
						google.maps.event.addListener(chkPoly, 'click', function(event) {
							$.each(lst_sponsor, function(k, v) {
								v.close();
							});
							lst_sponsor = [];
							var sponsorinfo = new google.maps.InfoWindow({
								maxWidth : 430,
								minWidth : 100,
								minHeight : 100
							});
							sponsorinfo.setContent('<div class="overlay" style="display: block;"><div id="loading-img"></div></div>');
							sponsorinfo.setPosition(event.latLng);
							//lst_sponsor.push(sponsorinfo);
							//sponsorinfo.open(map);
							$.ajax({
								url : '/component/get_kobo_RHS_list/' + global_slum_id + '/' + v2['housenumber'],
								type : "GET",
								contenttype : "json",
								success : function(json) {
		  						var spstr = "";
									spstr += '<table class="table table-striped" style="font-size: 10px;"><tbody>';
									if(json['FFReport']){
										flag = false;
										$("a[name=chk_group]:contains('Sponsor')").parent().find('input[type=checkbox]').slice(1).each(function(ind, chk){
												if($(chk).is(":checked")){
														flag=true;
													}
										});
										if (flag){
									  	spstr += '<tr><td colspan="2"><a href="javascript:familyfactsheet_click('+global_slum_id+', '+v2["housenumber"]+')" style="cursor:pointer;color:darkred;">View Factsheet</a></td></tr>';
										}
								  }
									var flag = false;
									$.each(json, function(k, v) {
										flag = true;
										spstr += '<tr><td>' + k + '</td><td>' + v + '</td></tr>';
									});
									spstr += '</tbody></table>';
									if (flag){
									sponsorinfo.setContent(spstr);
									lst_sponsor.push(sponsorinfo);
									sponsorinfo.open(map);
								 }
								}

							});

						});
					}

					chkdata[k1][v2['housenumber']] = chkPoly;
					var options = {
								map: map,
								position: bounds.getCenter(),
								text: '',
								minZoom: 8,
								zIndex : 999
							};
					var slumLabel = new MapLabel(options);
						//slumLabel.changed('text');
					google.maps.event.addListener(chkPoly, 'mouseover', function(event) {
				    slumLabel.text = v2['housenumber'];
				    slumLabel.changed('text');
				  });
				  google.maps.event.addListener(chkPoly, 'mouseout', function(event) {
				    slumLabel.text = '';
				    slumLabel.changed('text');
					});

				});
			} else {
				$.each(v1['child'], function(k2, v2) {

					if (chkdata["Houses"][v2] != undefined) {
						var poly_house = $.extend(true, {}, chkdata["Houses"][v2]);
						var chkcolor = v1['blob']['polycolor'];
						var chklinecolor = v1['blob']['linecolor'];
						var chklinewidth = v1['blob']['linewidth'];
						poly_house.setOptions({
							fillOpacity : 0.6,
							strokeOpacity : 0.8,
							fillColor : chkcolor,
							strokeColor : chklinecolor
						});
						chkdata[k1][v2] = poly_house;
					}
				});
			}
		});
		str += '</div></div>';

	});

	compochk.html(str);
}

var zindex = 0;
//Filter checkbox selection to display relavent data on MAP
function checkSingleGroup(single_checkbox) {
	//componentfillmap();
	var chkchild = $(single_checkbox).val();
	var section = $(single_checkbox).attr('selection');
	var component_type = $(single_checkbox).attr('component_type');
	glob_polygon.setMap(null);
	if ($(single_checkbox).is(':checked')) {
		zindex++;
		$.each(chkdata[chkchild], function(k4, v4) {
			v4.setMap(map);
			v4.set("zIndex", zindex);
		//	if (section == "Sponsor") {
				// google.maps.event.addListener(v4, 'click', function(event) {
				// 	$.each(lst_sponsor, function(k, v) {
				// 		v.close();
				// 	});
				// 	lst_sponsor = [];
				// 	var sponsorinfo = new google.maps.InfoWindow({
				// 		maxWidth : 430,
				// 		minWidth : 100,
				// 		minHeight : 100
				// 	});
				// 	sponsorinfo.setContent('<div class="overlay" style="display: block;"><div id="loading-img"></div></div>');
				// 	sponsorinfo.setPosition(event.latLng);
				// 	$.ajax({
				// 		url : '/component/get_kobo_RHS_list/' + global_slum_id + '/' + k4,
				// 		type : "GET",
				// 		contenttype : "json",
				// 		success : function(json) {
  			// 			var spstr = "";
				// 			spstr += '<table class="table table-striped" style="font-size: 10px;"><tbody>';
				// 			spstr += '<tr><td colspan="2"><a href="/media/report/' + k4 + '_'+arr[3].replace(/ /g,"_").replace(/,/g,"")+'.pdf" style="cursor:pointer;color:darkred;" target="blank">View Factsheet</a></td></tr>';
				// 			$.each(json, function(k, v) {
				// 				spstr += '<tr><td>' + k + '</td><td>' + v + '</td></tr>';
				// 			});
				// 			spstr += '</tbody></table>';
				// 			sponsorinfo.setContent(spstr);
				// 			lst_sponsor.push(sponsorinfo);
				// 			sponsorinfo.open(map);
				// 		}
				//
				// 	});
				//
				// });
			//}
		});
	} else {
		$.each(chkdata[chkchild], function(k4, v4) {
			v4.set("zIndex", null);
			//v4.setZIndex(null);
			v4.setMap(null);
		});
		//zindex--;
	}
}

//RIM data display in modal popup
function tabularSingleGroup(single_model) {

	mk = $(single_model).attr('selection');
	var modelheader = $("#modelhdtext");
	var modelbody = $("#modelbody");
	var chkstr = "";

	modelheader.html(mk);
	chkstr = "";
	var spstr = "";
	var commentstr = "";
	json = global_RIM[modelsection[mk]];
	spstr += '<table class="table table-striped"  style="margin-bottom:0px;font-size: 12px;">';
  $("#myModal>div").removeClass("modal-lg");
	if ( json instanceof Array) {
		$("#myModal>div").addClass("modal-lg");
		//var largest_keys = json[0];//.sort(function(a,b){return Object.keys(b).length - Object.keys(a).length}).slice(0,1);
		var toilet_header = "<thead><tr><th>&nbsp;</th>";
		var toilet_body = "<tbody>";
		for (i=0; i<json.length; i++){
			toilet_header += "<th> CTB " +(i+1) + "</th>";
		}
		toilet_header+= "</tr></thead>";
		if(json.length > 0){
			keys_headers = Object.keys(json[0]);
			$.each(keys_headers.slice(3, keys_headers.length-1), function(k, v) {
				toilet_body += '<tr><td style="font-weight:bold;width:200px;">' + v + '</td>';

				for (i=0; i<json.length; i++){
					val = json[i][v];
					if(val == undefined)
							val="&nbsp;";
					toilet_body += '<td>' + val + '</td>';
				}
				toilet_body += '</tr>';
			});
		}
		else{
			toilet_body += '<tr><td>No CTB\'s</td></tr>';
		}
		spstr += toilet_header + toilet_body;

	} else {
		spstr += "<tbody>";
		$.each(json, function(k, v) {

			if (k.indexOf("comment") != -1 || k.indexOf("Describe") != -1) {
				commentstr += '<tr><td  colspan=2><label style="font-weight:bold;">' + k + ': </label> ' + v + '</td></tr>';
			} else {
				spstr += '<tr><td style="font-weight:bold;width:50%;">' + k + '</td><td>' + v + '</td></tr>';
			}

		});
	}
	spstr += commentstr + '</tbody></table>';
	modelbody.html(spstr);
  $("#myModal").modal('show');
}
