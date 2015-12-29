$(function () {
    // google api
	
	// global storage
	var query = "";
	var categoryList = [];
	
	/* Category Class */
	var Category = function(){
		this.type = "";
		this.conceptName = "";
		this.concept = null;
		this.expanded = false;
		
		this.expandCategory = function(){
			//alert(this.type + "\n" + this.conceptName + (this.conceptName == query ? "\nSame" : ""));
			// check expand or contract
			if (this.expanded == true) return;
			
			// specific concept
			this.concept = new Concept(
				(this.conceptName==query ? this.conceptName + " " + this.type
				: this.conceptName));
				
			this.expanded = true;
		}
		this.contractCategory = function(){
			return;
		}
	}
	
	/* Concept Class */
	var Concept = function(conceptName){
		this.name = "";
		this.description = "";
		this.relatedURL = []; /* title, url */
		this.images = [];
		
		// private set method
		var setName = function(conceptName){
			this.name = conceptName;
		}
		
		this.expandCategory = function(){
			return;
		}
		this.expandConcept = function(){
			return;
		}
		
		// Concept Constructor
		// set concept name
		setName(conceptName);
		// get description from wikipedia 
		wikipediaRef(conceptName, function(value){
			this.description = value;
		});
		
		// get related URL from google
		googleURLRef(conceptName, function(value){
			this.relatedURL = value;
		});

		// get images URL from google
		googleImageRef(conceptName, function(value){
			this.images = value;
		});
		
		
		/* display concept data */
		setTimeout(function(){
			//alert(this.name + " conceptName: " + conceptName);
			showConcept(this);
		}, 4000);
		
	}
	
	/* Freebase */
	/* Query tester for Freebase http://www.freebase.com/query */
	/* conceptList {id, score} */
	function freebaseRef(query) {
		var conceptList = [];
		
		// get relevant concept id from freebase
		$.ajax({
            type: 'GET',
            url: "https://www.googleapis.com/freebase/v1/search?query=" + query,
            dataType: 'json',
            success: function (data) {
				if (data.status == "200 OK"){
					for (var i = 0 ; i < data.result.length ; i++){
						conceptList.push({
							id: data.result[i].id,
							score: data.result[i].score
						});
					}
					// sort the concepts according to score
					conceptList.sort(function(a, b){return b.score-a.score});
					for (var i = 0 ; i < 5 && i < conceptList.length ; i++){
						if (conceptList[i].id.indexOf("undefined") > -1) break;
						getDomain(conceptList, i);
					}
				}
				else{
					// error handling if return error from freebase
					// alternative Wikidata?
				}
            }
        });
		
	}
	
	/* Freebase helper function */
	// get domain for the 3 most relevant concepts (score)
	function getDomain(conceptList, i){
		var category = new Category();
		// remove underline and capitalize each word
		category.conceptName = conceptList[i].id.substring(conceptList[i].id.lastIndexOf('/') + 1, conceptList[i].id.length);
		category.conceptName = category.conceptName.replace(/_/g, " ");
		
		// set up domain query
		var q = [{
			"id": conceptList[i].id,
			"type": [{
				"name": null,
				"id": null,
				"/freebase/type_profile/instance_count": null,
				"sort": "-/freebase/type_profile/instance_count",
				"name!=": "Topic",
				"limit": 5
			}]
		}];
			
		$.ajax({
			type: 'GET',
			url: "https://www.googleapis.com/freebase/v1/mqlread?key=" + apiKey + "&query=" + JSON.stringify(q),
			dataType: 'jsonp',
			success: function (data) {
				// get only the first type name
				category.type = data.result[0].type[0].name.toString();
				// get more meaningful category for "Thing"
				if (category.type.indexOf("Thing") == 0)
					category.type = data.result[0].type[1].name.toString();
				categoryList.push(category);
				/* 
				for (var j = 0 ; j < data.result[0].type.length ; j++){
					//categoryList[i].domain.push(data.result[0].type[j].name.toString());
				}
				*/
			}
		});
	}
	
	/* Wikipedia */
	function wikipediaRef(concept, callback){
		// for people example
		// https://en.wikipedia.org/w/api.php?action=query&prop=categories&titles=Albert%20Einstein
		
		// for stuff example
		// string: convert space to +
		var q = concept;
		q = q.replace(/ /g, "+");
		
		$.ajax({
			type: 'GET',
			url: "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exsentences=5&explaintext=true&redirects=true&titles=" + q,
			dataType: 'jsonp',
			success: function (data) {
				// get json unknown page key
				var temp = data.query.pages;
				temp = Object.keys(temp)[0];
				// get corresponding extract
				var extract = data.query.pages[temp].extract;
				callback(extract);
			}
		});
	}
	
	/* Google related URL */
	function googleURLRef(concept, callback){
		var q = concept;
		q = q.replace(/ /g, "+");
		var urlList = new Array();
		
		$.ajax({
			type: 'GET',
			url: "source.php?google=" + q,
			dataType: 'json',
			success: function(data){
				for (var i = 0 ; i < data.title.length ; i++){
					// skip undefined url
					if (data.url[i] == undefined)
						continue;
					var titleAndUrl = {
						title: data.title[i],
						url: data.url[i]
					};
					urlList.push(titleAndUrl);
				}
				callback(urlList);
			},
			error: function (jqXHR, textStatus, errorThrown) {
                alert("Google Fail" + jqXHR + " " + textStatus + " " + errorThrown);
            }
		});
	}
	
	/* Google images URL */
	function googleImageRef(concept, callback){
		var q = concept;
		q = q.replace(/ /g, "+");
		var urlList = new Array();
		
		$.ajax({
			type: 'GET',
			url: "source.php?googleImage=" + q,
			dataType: 'json',
			success: function(data){
				for (var i = 0 ; i < data.image.length ; i++){
					urlList.push(data.image[i]);
				}
				callback(urlList);
			},
			error: function (jqXHR, textStatus, errorThrown) {
                alert("Google Image Fail" + jqXHR + " " + textStatus + " " + errorThrown);
            }
		});
	}
	
	// invoke initial search
	$('#test').click(function(){
		// initialize all variables
		$('#templateContainer').empty();
		categoryList = [];
		
		query = $('#searchInput').val();
		$('#templateContainer').append("<div align=\"center\">" + query + "</div>");
		freebaseRef(query);
		
		// printout testing
		setTimeout(function(){
			for (var i = 0 ; i < categoryList.length ; i++){
				$('<div/>', {
					html: categoryList[i].type + "<br /><br />" + categoryList[i].conceptName,
					class: "category"
				}).data(categoryList[i]).appendTo('#templateContainer');
			}
		}, 4000);
	});
	
	// click on category
	$('body').on('click', '.category', function(){
		var element = $(this).data();
		element.expandCategory();
	});
	
	// display concept data
	function showConcept(concept){
		if (concept != null){
			var urlDisplay = "";
			if (concept.relatedURL != undefined)
				for (var i = 0 ; i < concept.relatedURL.length ; i++)
					urlDisplay += "<b>" + concept.relatedURL[i].title + "</b><br />" + concept.relatedURL[i].url + "<br />";
			
			var imageDisplay = "";
			if (concept.images != undefined)
				for (var i = 0 ; i < concept.images.length ; i++)
					imageDisplay += "<img src=\"" + concept.images[i] + "\" width=\"100px\" />";
			
			$('<div/>', {
					html: "<b>Name</b> : <br />" + concept.name + "<br />" + 
							"<b>Description</b> : <br />" + concept.description + "<br />" +
							"<b>Related Links</b> : <br /><br />" + urlDisplay + "<br />" + 
							"<b>Image</b> : <br />" + imageDisplay + "<br />",
					class: "concept"
			}).data(concept).appendTo('#templateContainer');
		}
	}
});

