$(function () {
    // google custom search api
	
    /* Google */
    /* Get title, hyperlink, image(if any) from google search */
    $('#searchGoogle').click(function () {
        var query = $('#searchInput').val();
        $.ajax({
            type: 'GET',
            url: "https://www.googleapis.com/customsearch/v1?key=" + apiKey + "&cx=" + cx + /*"&searchType=image" +*/"&q=" + query,
            timeout: 10000,
            dataType: 'text',
            success: function (data) {
                $('#resultContent').html("");
                var result = JSON.parse(data);
                var title = [];
                // returned data format reference:
                // https://developers.google.com/custom-search/json-api/v1/reference/cse/list#response
                for (var i = 0; i < result.items.length; i++) {
                    $('#resultContent').append(result.items[i].htmlTitle + "<br />" + result.items[i].link + "<br />" + result.items[i].image + "<br /><br />");
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("Fail" + jqXHR + " " + textStatus + " " + errorThrown);
            }
        });
    });

    /* Wikipedia */
    $('#searchWikipedia').click(function () {
        var query = $('#searchInput').val();

        $.ajax({
            type: 'GET',
            url: "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=" + query,
			//contentType: "application/json; charset=utf-8",
            dataType: 'jsonp',
            success: function (data) {
                $('#resultContent').html("");
                for (var i = 0; i < data.query.search.length; i++) {
                    $('#resultContent').append(data.query.search[i].title + "<br />" + data.query.search[i].snippet + "<br /><br />");
                }
            }
        });
    });

    /* Wikidata (new version of freebase)*/
    $('#searchWikidata').click(function () {
        var query = $('#searchInput').val();

        $.ajax({
            type: 'GET',
            url: "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&search=" + query,
            dataType: 'jsonp',
            success: function (data) {
                $('#resultContent').html("");
                for (var i = 0; i < data.search.length; i++) {
					// neglect record for Wikipedia disambiguation pageX
					if (data.search[i].description.toString().indexOf("disambiguation page") > -1)
						continue;
                    $('#resultContent').append(data.search[i].label + "<br />" + data.search[i].description + "<br /><br />");
                }
            }
        });
    });
	
	/* Pearson Dictionary http://developer.pearson.com/apis/dictionaries */
	$('#searchPearson').click(function(){
		var query = $('#searchInput').val();
		
		$.ajax({
            type: 'GET',
            url: "http://api.pearson.com/v2/dictionaries/entries?part_of_speech=noun&headword=" + query,
            dataType: 'json',
            success: function (data) {
                $('#resultContent').html("");
                $('#resultContent').append("<br />" + data.results[0].senses[0].definition + "<br /><br />");
            }
        });
	});
	
	/* Freebase */
	/* Query tester for Freebase http://www.freebase.com/query */
	$('#searchFreebase').click(function(){
		var query = $('#searchInput').val();
		var conceptList = [];
		var domainList = [];
		
		// get relevant concept id from freebase
		$.ajax({
            type: 'GET',
            url: "https://www.googleapis.com/freebase/v1/search?query=" + query,
            dataType: 'json',
            success: function (data) {
                $('#resultContent').html("");
				if (data.status == "200 OK"){
					for (var i = 0 ; i < data.result.length ; i++){
						conceptList.push({
							id: data.result[i].id,
							score: data.result[i].score
						});
					}
				}
				// sort the concepts according to score
				conceptList.sort(function(a, b){return b.score-a.score});
				for (var i = 0 ; i < 5 || i < conceptList.length ; i++){
					if (conceptList[i].id.indexOf("undefined") > -1) break;
					getDomain(conceptList, domainList, i);
					//$('#resultContent').append("id: " + conceptList[i].id + " score: " + conceptList[i].score + "<br /><br />");
				}
            }
        });
		setTimeout(function(){
			// printout testing
			for (var i = 0 ; i < domainList.length ; i++){
				$('#resultContent').append("<br />" + domainList[i].id + "<br />");
				for (var j = 0 ; j < domainList[i].domain.length ; j++){
					$('#resultContent').append(domainList[i].domain[j].toString() + "<br />");
				}
			}
		}, 2000);
	});
	
	function getDomain(conceptList, domainList, i){
		// get domain for the 3 most relevant concepts (score)
		
			// make space for storing domain for a concept
			domainList.push({
				id: conceptList[i].id,
				domain: []
			});
			
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
					//alert(data.result);
					for (var j = 0 ; j < data.result[0].type.length ; j++){
						// if domain already exists, skip the insertion
						//if ($.inArray(data.type.name.toString(), domainList)) continue;
						domainList[i].domain.push(data.result[0].type[j].name.toString());
					}
				}
			});
	}
	
	/* Web crawling */
	// google related url
	$('#webCrawl').click(function(){
		$('#resultContent').html("");
		var query = $('#searchInput').val().replace(/ /g, "+");
		$.ajax({
			type: 'GET',
			url: "source.php?google=" + query,
			dataType: 'json',
			success: function(data){
				//alert(data);
				for (var i = 0 ; i < data.title.length ; i++){
					$('#resultContent').append(data.title[i] + "<br />" + data.url[i]);
					$('#resultContent').append("<br /><br />");
				}
				
			},
			error: function (jqXHR, textStatus, errorThrown) {
                alert("Fail" + jqXHR + " " + textStatus + " " + errorThrown);
            }
		});
	});
	
	// google image
	$('#webCrawlImage').click(function(){
		$('#resultContent').html("");
		var query = $('#searchInput').val().replace(/ /g, "+");
		$.ajax({
			type: 'GET',
			url: "source.php?googleImage=" + query,
			dataType: 'json',
			success: function(data){
				for (var i = 0 ; i < data.image.length ; i++){
					$('#resultContent').append("<img src=\"" + data.image[i] + "\" />");
				}
				
			},
			error: function (jqXHR, textStatus, errorThrown) {
                alert("Fail" + jqXHR + " " + textStatus + " " + errorThrown);
            }
		});
	});
});

