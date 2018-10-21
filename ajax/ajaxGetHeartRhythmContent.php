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
	
	// ecg waveforms
	
	$currentECG = dbClass::valuesFromPost('currentECG');
	$currentPulse = dbClass::valuesFromPost('currentPulse');
	$currentAmplitude = dbClass::valuesFromPost('currentAmplitude');
	$currentPulseFrequency = dbClass::valuesFromPost('currentPulseFrequency');
	$currentPEA = dbClass::valuesFromPost('PEA');
	$currentArrest = dbClass::valuesFromPost('arrest');
	
	// create PEA value
	if($currentPEA == 'true') {
		$PEAChecked = ' checked="checked" ';
	} else {
		$PEAChecked = '';
	}
	
	// create arrest value
	if($currentArrest == 'true') {
		$arrestChecked = ' checked="checked" ';
	} else {
		$arrestChecked = '';
	}
	
	// generate ecg dropdown
	
	$content = '
		<h1 id="modal-title">Set Heart Rhythm</h1>

		<hr class="modal-divider clearer" />
		<div class="control-modal-div heart-rhythm ecg clearer">
			<p class="modal-section-title">Select ECG</p>
			<select class="ecg-select modal-select">
				' . controls::getECGDropDown($currentECG) . '
			</select>
		</div>		
		<div class="control-modal-div heart-rhythm amplitude">
			<p class="modal-section-title">Amplitude</p>
			<select class="amplitude-select modal-select">
				' . controls::getVFIBAmplitudeDropDown($currentAmplitude) . '
			</select>
		</div>		
		<div class="control-modal-div heart-rhythm pea">
			<p class="modal-section-title">PEA</p>
			<input type="checkbox" value="yes" ' . $PEAChecked . ' name="PEA" id="PEA">
		</div>
		<div class="control-modal-div heart-rhythm pea">
			<p class="modal-section-title">Arrest</p>
			<input type="checkbox" value="yes" ' . $arrestChecked . ' name="arrest" id="arrest">
		</div>
		<div class="control-modal-div heart-rhythm pulses clearer">
			<p class="modal-section-title">VPC</p>
			<select class="pulse-select modal-select">
				' . controls::getPulseDropDown($currentPulse) . '
			</select>
		</div>		
		<div class="control-modal-div heart-rhythm frequency">
			<p class="modal-section-title">VPC Frequency</p>
			<select class="frequency-select modal-select">
				' . controls::getPulseFrequencyDropDown($currentPulseFrequency) . '
			</select>			
		</div>
		
		
		<hr class="modal-divider clearer" />
		<h2 class="modal-section-title">Heart Rate (BPM)</h2>
		<div class="control-modal-div">
			<p class="modal-input-label">Current</p>
			<p class="modal-input-label new-value">New</p>
			<a class="control-incr-decr-rate decr-rate" href="javascript: void(2);"><<</a>
			<input value="0" class="strip-value current" readonly="readonly" disabled="disabled">

			<!-- old slider -->
			<!-- <div class="control-slider-1"></div>
			<input value="0" class="strip-value new"> -->
			
			<!-- New slider -->
			<input value="0" class="strip-value new control-slider-1 float-left" data-highlight="true">		
			
			<a class="control-incr-decr-rate incr-rate" href="javascript: void(2);">>></a>
			<div class="clearer"></div>
		</div>

		<hr class="modal-divider" />
		<div class="control-modal-div">
			<button class="red-button modal-button apply">Apply</button>
			<button class="red-button modal-button cancel">Cancel</button>
		</div>
	';


	$returnVal['status'] = AJAX_STATUS_OK;
	$returnVal['html'] = $content;
	echo json_encode($returnVal);
	exit();


?>