<?php
	session_start();

	// plugin for web crawling
	// reference: http://simplehtmldom.sourceforge.net/
	include_once('Scripts/php/simple_html_dom.php');

	if (isset($_GET["google"])){
		// crawl google search result
		$target_url = "https://www.google.co.uk/search?q=".str_replace(" ", "+" , $_GET["google"]);
		//$target_url = "https://www.google.co.uk/search?q=apple+inc";
		$html = file_get_html($target_url);
		//echo $html;
		
		// array for storing title and url
		$title = array();
		$hyperlink = array();
		$result = ""; // combined array
		
		foreach($html->find('li.g') as $wrapper){
			$link = $wrapper->find('h3.r', 0);
			// filter case
			if ($link->plaintext == "" || strpos($link->plaintext, "News for") !== false) continue;
			
			array_push($title, $link->plaintext);
			//echo $link->plaintext."<br />";
		}
		foreach($html->find('div.kv cite') as $url){
			array_push($hyperlink, $url->plaintext);
		}
		
		// format json return (title, url)
		$result .= "{\"title\":[";
		
		for ($i = 0 ; $i < count($title) ; $i++){
			$result .= "\"".$title[$i]."\"";
			if ($i != count($title) - 1)
				$result .= ",";
		}
		$result .= "], \"url\":[";
		for ($i = 0 ; $i < count($hyperlink) ; $i++){
			$result .= "\"".$hyperlink[$i]."\"";
			if ($i != count($hyperlink) - 1)
				$result .= ",";
		}
		
		$result .= "]}";
		echo $result;
	}
	else if (isset($_GET["googleImage"])){
		// crawl google image search result
		$target_url = "https://www.google.co.uk/search?tbm=isch&q=".str_replace(" ", "+", $_GET["googleImage"]);
		//$target_url = "https://www.google.co.uk/search?tbm=isch&q=apple+inc";
		$html = file_get_html($target_url);
		//echo $html;
		
		// array for storing image url
		$hyperlink = array();
		$result = ""; 
		
		foreach($html->find('img') as $url){
			array_push($hyperlink, $url->src);
		}
		
		// format json return (title, url)
		$result .= "{\"image\":[";
		
		for ($i = 0 ; $i < count($hyperlink) ; $i++){
			$result .= "\"".$hyperlink[$i]."\"";
			if ($i != count($hyperlink) - 1)
				$result .= ",";
		}
		
		$result .= "]}";
		echo $result;
	}
	else{
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Server Knowledge Graph</title>
    <script src="Scripts/jquery-1.11.3.min.js" type="text/javascript"></script>
    <script src="Scripts/main.js" type="text/javascript"></script>
    
    
    <link rel="stylesheet" href="Styles/style.css" />
</head>
<body>
    <gcse:search></gcse:search>
    <input type="text" id="searchInput"></input>
    <button id="searchGoogle">SearchGoogle</button>
	<button id="searchWikipedia">SearchWikipedia</button>
	<button id="searchWikidata">SearchWikidata</button>
	<button id="searchFreebase">SearchFreebase</button>
	<button id="searchPearson">SearchPearson</button>
	<button id="webCrawl">WebCrawlGoogle</button>
	<button id="webCrawlImage">WebCrawlGoogleImage</button>
    <div id="resultContent"><?=$q;?></div>
</body>
</html>
<?php
	}
?>