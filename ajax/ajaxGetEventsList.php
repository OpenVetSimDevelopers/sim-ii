<?php
	// init
	require_once("../init.php");
	$returnVal = array();

	// is user logged in
	if(adminClass::isUserLoggedIn() === FALSE) {
		$returnVal['status'] = AJAX_STATUS_LOGIN_FAIL;
		echo json_encode($returnVal);
		exit();
	}
	
	// get profile info
	$eventsArray = json_decode(str_replace("\\", "", dbClass::valuesFromPost('events')), TRUE);
	if(count($eventsArray) == 0) {
		$returnVal['status'] = AJAX_STATUS_FAIL;
		echo json_encode($returnVal);
		exit();		
	}
					
	$content = '';

	// get elements of event library
	foreach($eventsArray['category'] as $eventCategory) {
		$content .= '
				<div class="event-library-col">
					<h2>' . $eventCategory['title'] . '</h2>
					<ul class="event-primary">
		';
		
		// get next level
		if(count($eventCategory) == 0) {
			$returnVal['status'] = AJAX_STATUS_FAIL;
			echo json_encode($returnVal);
			exit();		
		}
		foreach($eventCategory as $eventKey => $eventArray) {
			if($eventKey != 'event') {
				continue;
			}

			// iterate over events
			if(count($eventArray) == 0) {
				$returnVal['status'] = AJAX_STATUS_FAIL;
				echo json_encode($returnVal);
				exit();					
			}
			foreach($eventArray as $event) {
				$content .= '
						<li>
							<img class="event-check primary" src="' . BROWSER_IMAGES . 'check.png" alt="event checkmark">
							<a data-category="' . $eventCategory['title'] . '" data-category-id="' . $eventCategory['name'] . '" data-event-id="' . $event['id'] . '" href="javascript: void(2);" onclick="events.sendEventLibraryClick(this);">' . $event['title'] . '</a>
						</li>					
				';
			}
		}
		
		$content .= '
					</ul>
				</div>		
		';
	}

	$returnVal['status'] = AJAX_STATUS_OK;
	$returnVal['html'] = $content;
	echo json_encode($returnVal);
	exit();
?>