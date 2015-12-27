$(function () {
    // google api
    var cx = '017626171439071672611:amtplklj3cm';
    var apiKey = "AIzaSyBJDEDg48JHQpXKAt1dx95ROKsx94HmHrg";
	
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
			//developeNode(concept);
		}
		this.contractCategory = function(){
			return;
		}
	}
	
	/* Concept Class */
	var Concept = function(name){
		this.name = name;
		this.description = "";
		this.relatedURL = []; /* title, url */
		this.images = [];
		
		// Concept Constructor
		// get description from wikipedia 
		wikipediaRef(this.name, function(value){
			this.description = value;
		});
		
		// get related URL from google
		googleURLRef(this.name, function(value){
			this.relatedURL = value;
		});

		// get images URL from google
		googleImageRef(this.name, function(value){
			this.images = value;
		});
		
		this.expandCategory = function(){
			return;
		}
		this.expandConcept = function(){
			return;
		}
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
				var extract = data.query.pages[temp].extract.toString();
				callback(extract);
			}
		});
	}
	
	/* Google related URL */
	function googleURLRef(concept, callback){
		var urlList = new Array();
        $.ajax({
            type: 'GET',
            url: "https://www.googleapis.com/customsearch/v1?key=" + apiKey + "&cx=" + cx + "&q=" + concept,
            timeout: 10000,
            dataType: 'text',
            success: function (data) {
                var result = JSON.parse(data);
				// store only 5 related URL
				for (var i = 0; i < result.items.length && i < 5; i++) {
					var titleAndUrl = {
						title: result.items[i].htmlTitle.replace(/<([^>]+)>/g, ""),
						url: result.items[i].link
					};
					urlList.push(titleAndUrl);
                }
				callback(urlList);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("Fail" + jqXHR + " " + textStatus + " " + errorThrown);
            }
        });
	}
	
	/* Google images URL */
	function googleImageRef(concept, callback){
		var urlList = new Array();
        $.ajax({
            type: 'GET',
            url: "https://www.googleapis.com/customsearch/v1?key=" + apiKey + "&cx=" + cx + "&searchType=image" +"&q=" + concept,
            timeout: 10000,
            dataType: 'text',
            success: function (data) {
                var result = JSON.parse(data);
				// store only 5 images URL
				for (var i = 0; i < result.items.length && i < 5; i++) {
					urlList.push(result.items[i].link);
                }
				callback(urlList);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("Fail" + jqXHR + " " + textStatus + " " + errorThrown);
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
});

