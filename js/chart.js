	
	// routine to get max of an array
	Array.prototype.max = function () {
		return Math.max.apply(Math, this);
	};
	
	var chart = {
		status: {
			cardiac: {
				heartRate: 0,
				synch: false,
				vpcSynch: false,
			},
			
			resp: {
				synch: false,
				manual: false
			}
		},
		
		displayETCO2: {
			max: 0
		},
		
		// baseline params for introducing sinusoid amplitude into generated waveform
		// params are fixed for no oscillations
		baselineP1: 0,
		baselineP2: 0,
		baselineUnit: 0.1,
		
		// fibrillation parameters
		fibP1: 0,
		fibP2: 0,
		fibP3: 0,
		
		// following params are fixed for high frequency filtering for vfib
		fibUnit1: 12,
		fibUnit2: 12,
		fibP1Constant: 4.3,
		fibP2Constant: 2.7,
		// ------------------
		
		fibP3ListIndex: 0,
//		fibP3List: [ 10, 9, 8, 9, 10, 11, 12, 13, 14,14,15,16,16,15,14,13,12,11, 10, 9, 8, 7, 6, 5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11, 10, 11, 12, 9, 8, 9 ],
		fibP3List: [ 10, 9, 8, 9, 10, 11, 12, 13, 14,14,15,16,16,15,14,13,12,11],
		fibDivide: 6, // amplitude of ventricular bibrillation
						// 4 = fine
						// 3 - medium
						// 1 - coarse
		
		vfib: {
			base: 0
		},
		
		afib: {
			delay: new Array,
			delayCount: 100,
			delayPtr: 0
		},

		// cpr status constants
		// delay stop in msec
		CPR_DELAY_NONE: 0,			// no delay in progress for cpr display of HR '----' 
		CPR_DELAY_START: 1,			// start delay for cpr display of HR '----' 
		CPR_DELAY_STOP: 2,			// stop delay for cpr display of HR '----' 
		CPR_ACTIVE: 2,				// active cpr display of HR '----'
		CPR_DELAY_IN: 3000,			// delay start in msec
		CPR_DELAY_OUT: 3000,		// delay stop in msec
		cprDelayTimer: 0,			// timer for cpr delay
		
		// ekg strip parameters
		ekg: {
			width: 0,				// width of strip in pixels
			height: 125,			// height of strip in pixles
			id: 'vs-trace-1',		// id of canvas for strip
			interval: 0,			// variable to hold interval instantiation
			color: 'green',			// color of trace (either hex or html color)
			rhythm: new Array,		// array of digitized rhythms
			yOffset: 0,				// yOffset of trace
			xOffsetLeft: 10,		// left xOffset of trace
			xOffsetRight: 0,		// right xOffset of trace
			rhythmIndex: '',		// index of current rhythm being displayed
			rateIndex: 0,			// index of pattern for current heart rate
			length: 0,				// variable to hold length of pattern
			patternIndex: 0,		// index of currently displayed pixel in pattern
			vpcLength: 0,			// length of current vpc pattern
			vpcPatternIndex: 0,		// index of currently displayed pixel in vpc pattern
			vpcDelay: 0,			// delay im millisec of how long sinus complex is extended
			vpcCount: 0,			// count of how many vpc's have been generated
			lastY: 0,				// variable to save last displayed Y coordinate of pattern
			xPos: 0,				// current x position on strip
			drawInterval: 15,		// interval in milli-sec to display pixels
			noiseMax: 2,			// max amplitude of background noise total +/-
			stopFlag: false,			// stop flag 
			beepValue: 0,			// value to beep at
			beepFlag: false,
			vpcSynchDelay: 0,		// delay added in to synh if VPC is generated
			pixelCount: 0,			// count in pixel ticks (drawInterval) of current period (incrementing)
			periodCount: 0,			// number of pixel counts in current period
			cprHRDisplayStatus: 0 	// status of hr display {CPR_DELAY_NONE || CPR_DELAY_START || CPR_DELAY_STOP || CPR_ACTIVE}
		},
		
		// respiration strip parameters
		resp: {
			width: 0,				// width of strip in pixels
			height: 125,			// height of strip in pixles
			id: 'vs-trace-2',		// id of canvas for strip
			interval: 0,			// variable to hold interval instantiation
			color: 'white',			// color of trace (either hex or html color)
			rhythm: new Array,		// array of digitized rhythms
			yOffset: 0,				// yOffset of trace
			xOffsetLeft: 10,		// left xOffset of trace
			xOffsetRight: 0,		// right xOffset of trace
			rhythmIndex: 'low',			// index of current rhythm being displayed
			length: 10,				// variable to hold length of pattern
			patternIndex: 0,		// index of currently displayed pixel in pattern
			lastY: 0,				// variable to save last displayed Y coordinate of pattern
			xPos: 0,				// current x position on strip
			drawInterval: 50,		// interval in milli-sec to display pixels
			activeCount: 0,			// Count of updates since sync
			halfCount: 100,			// Count to middle of period, for start of Exhale
			stopFlag: false,		// stop flag
			phaseTimer: 0,			// timer hold,
			inhalationPerCent: 0.1,	// percent of AWRR that ETCO2 is low
			exhalationPerCent:	0.1, // percent of AWRR that ETCO2 is high
			ETCO2MaxDuration: 2000,	// max duration of ETCO2 high in msec
			inhalationDuration: 0,	// duration of inhalation in msec
			exhalationDuration: 0,	// duration of exhalation in msec
			patternComplete: false,	// flag for resp pattern complete
			risePatternIndex: 4,	// pattern index for resp based on awRR
			pixelCount: 0,			// count in pixel ticks (drawInterval) of current period (incrementing)
			periodCount: 0			// number of pixel counts in current period
		},
		
		cursorWidth: 10,			// width of cursor in pixels

		// assume document is rendered before calling init.
		init: function() {
			/************************** EKG **********************************/
			// set initial pattern
			chart.ekg.rhythmIndex = 'asystole';	// Flatline
			chart.ekg.rateIndex = 0;	// lowest heart rate
			
			// init canvas for ekg
			chart.initStrip('ekg');
			
			// init rhythm patterns
			chart.ekg.rhythm.asystole = new Array;
			chart.ekg.rhythm.sinus = new Array;
			chart.ekg.rhythm.vfib = new Array;
			chart.ekg.rhythm.afib = new Array;
			chart.ekg.rhythm.vtach1 = new Array;
			chart.ekg.rhythm.vtach2 = new Array;
			chart.ekg.rhythm.vtach3 = new Array;  // place holder since vtach 3 is half sine
			chart.ekg.rhythm.cpr = new Array;  // place holder since cpr is similar to vtach3
			
			// init cpr waveform, assume rate will be 120 bpm and waveform is simple 1/2 sinusoidal
			var cprXIncr = (120 * chart.ekg.drawInterval * Math.PI) / 60000;
			var cprAmplitude = chart.ekg.height / 2;
			var cprIndex = 0;
			for(var x = 0; x <= Math.PI; x += cprXIncr) {
				chart.ekg.rhythm.cpr[cprIndex] = (Math.sin(x) * -cprAmplitude);
				cprIndex++;
			}
			
			// Atrial Fibrillation
			chart.ekg.rhythm['afib'][0] = [
				0, 1, 2, 3, 10, 17, 20, 52, 64, 40, 26, 10, 0, -10, -20, -15, -10, -1 // Up to 150
			];
			chart.ekg.rhythm['afib'][1] = [
				0, 2, 3, 10, 20, 52, 64, 26, 10, 0, -20, -15, -10, -1 // Up to 300
			];

			// Ventricular Tachycardia
			chart.ekg.rhythm['vtach1'][0] = [
				8, 8, 11, 21, 40, 56, 63, 67, 55, 37,
				17, -7, -13, -16, -21, -23, -24, -25, -26, -26,
				-24, -18, -11, -3, 5, 11, 14, 16, 15, 15,
				13, 12, 12, 13, 13, 17, 16, 15, 11, 9,
				9, 8, 8
			];
			chart.ekg.rhythm['vtach1'][1] = [
				8, 11, 21, 40, 56, 63, 67, 55, 37, 17,
				-7, -13, -16, -23, -26, -24, -18, -11, -3, 5, 
				11, 9, 8
			];
			chart.ekg.rhythm['vtach1'][2] = [
				8, 21, 40, 56, 63, 67, 37, 17,
				-7, -13, -26, -18, -11, 
				11, 8
			];
			chart.ekg.rhythm['vtach2'][0] = [
				0, 0, 0, 0, 0, 1, 2, 3, 3, 4,
				5, 3, -25, -52, -51, -49, -30, -19, -9, 11, 
				24, 25, 27, 28, 31, 35, 39, 42, 43, 40, 
				33, 25, 16, 9, 4, 0, 0, 0, 0, 0 
			];
			chart.ekg.rhythm['vtach2'][1] = [
				0, 1, 2, 3, 4, 5, 3, -25, -52, -30, 
				-19, -9, 11, 25, 35, 42, 33, 25, 16, 4
			];
			chart.ekg.rhythm['vtach2'][2] = [
				1, 5, 3, -25, -52, -30, 
				-19, 11, 35, 42, 33, 16, 4
			];
			chart.ekg.rhythm['vtach3'][0] = [
				0, 1, 2, 3
			];
			
			// asystole
			chart.ekg.rhythm['asystole'][0] = [
				0, 0, 0, 0, 0, 0, 0		// Flatline
			];
			
			// sinus
			chart.ekg.rhythm['sinus'][0] = [
				4, 3, 4, 6, 7, 7, 6, 4, 2, 1, 
				1, 1, 2, 2, 2, 3, 17, 52, 64, 26,
				-3, -5, -2, 0, 1, 2, 3, 4, 4, 5, 
				6, 7, 8, 10, 11, 13, 15, 16, 17, 17, 
				16, 14, 10, 7, 4, 2, 1, 0, 0, 1, 
				1 
			];
			chart.ekg.rhythm['sinus'][1] = [
				4, 3, 6, 7, 4, 2, 1, 2, 3, 17, 
				64, 26, -5, -2, 0, 2, 4, 5, 6,  10, 
				11, 15, 16, 17, 16, 10, 4, 1, 0, 1 
			];
			chart.ekg.rhythm['sinus'][2] = [
				4, 3, 7, 1, 3, 35, 64, -5, -2, 4, 
				6, 11, 15, 10, 4, 1 
			];
			chart.ekg.rhythm['sinus'][3] = [
				3, 7, 1, 3, 35, 64, -5, 4, 11, 17, 
				4, 1 
			];
			
			
			// vfib
			chart.ekg.rhythm['vfib'][0] = [
				2, 3, 17, 52, 64, 26, -3, -5, -2, 0, 1, 2, 3, 4, 4, 5, 6, 7, 
				8, 10, 11, 13, 15, 16, 17, 17, 16, 14, 10, 7, 4, 2, 1, 0, 0, 1, 1 // Up to 75
			];
			chart.ekg.rhythm['vfib'][1] = [
				2, 3, 17, 64, 26, -5, -2, 0, 2, 4, 5, 6,  10, 11, 15, 16, 17, 16, 10, 4, 1, 0, 1 // Up to 140
			];
			chart.ekg.rhythm['vfib'][2] = [
				3, 35, 64, -5, -2, 4, 6, 11, 15, 17, 10, 4, 1 // Up to 230
			];
			chart.ekg.rhythm['vfib'][3] = [
				3, 35, 64, -5, 4, 11, 17, 4, 1 // Up to 300
			];
			
			// setup pattern length
			chart.ekg.length = chart.ekg.rhythm[chart.ekg.rhythmIndex][chart.ekg.rateIndex].length
			
			// setup beep value
			chart.ekg.beepValue = chart.ekg.rhythm[chart.ekg.rhythmIndex][chart.ekg.rateIndex].max() * -1;
			
			// start the pattern
			chart.ekg.interval = setInterval(chart.drawEkgPixel, chart.ekg.drawInterval);
						
			/************************** Respiration **********************************/
			// init respiration
			chart.initStrip('resp');
			
			// init rhythm patterns
			chart.resp.rhythm['high-to-low'] = new Array;
			chart.resp.rhythm['low-to-high'] = new Array;
			chart.resp.rhythm['high-to-low'][0] = [	
				60,52,44,36,28,24,20,15,8,0
			];
			chart.resp.rhythm['high-to-low'][1] = [	
				60,44,36,20,8,0
			];
			chart.resp.rhythm['high-to-low'][2] = [	
				44,36,20,8
			];
			chart.resp.rhythm['high-to-low'][3] = [	
				40, 20
			];
			chart.resp.rhythm['high-to-low'][4] = [	
				30
			];
			chart.resp.rhythm['low'] = [	
				0,0
			];
			chart.resp.rhythm['low-to-high'][0] = [	
				0,8,15,20,24,28,36,44,52,60
			];
			chart.resp.rhythm['low-to-high'][1] = [	
				0,8,20,36,44,60
			];
			chart.resp.rhythm['low-to-high'][2] = [	
				8,20,36,44
			];
			chart.resp.rhythm['low-to-high'][3] = [	
				20, 40
			];
			chart.resp.rhythm['low-to-high'][4] = [	
				30
			];

			chart.resp.rhythm['high'] = [	
				62,62
			];
			
			chart.resp.manualBreathPattern = [	// approximate 300 msec waveform
				0,0,0,20,44,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,62,44,20,0,0
//				0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
			];
			
			// get max value
			chart.resp.max = chart.resp.rhythm['high'].max();
			
			// get max displayed value
			chart.getETC02MaxDisplay();

			// beep indicator
			if(chart.ekg.beepFlag == true){
				$('#ekg-sound').html('Turn EKG Sound OFF!').removeClass('play').addClass('pause')
			} else {
				$('#ekg-sound').html('Turn EKG Sound ON!').removeClass('pause').addClass('play')			
			}
			
			// setup pattern length
			chart.resp.length = chart.resp.rhythm[chart.resp.rhythmIndex].length;
			
			// start the pattern
			chart.resp.interval = setInterval(chart.drawRespPixel, chart.resp.drawInterval, "resp");
		},
		
		// Passed the cardiac data from simmgr status
		updateCardiac: function( cardiac) {
			if(controls.cpr.inProgress == true) {
				chart.ekg.rateIndex = 0;				
			} else if ( cardiac.rate <= 0  ) {
//				chart.ekg.rhythmIndex = 'asystole';	// Flatline
			} else if(chart.ekg.rhythmIndex == 'sinus') {
				if( cardiac.rate <= 73 ) {
					chart.ekg.rateIndex = 0;
				}
				else if( cardiac.rate <= 121 ) {
					chart.ekg.rateIndex = 1;
				}
				else if( cardiac.rate <= 220 ) {
					chart.ekg.rateIndex = 2;
				}
				else {
					chart.ekg.rateIndex = 3;
				}			
			} else if(chart.ekg.rhythmIndex == 'vfib') {
				if( cardiac.rate <= 75 ) {
					chart.ekg.rateIndex = 0;
				}
				else if( cardiac.rate <= 140 ) {
					chart.ekg.rateIndex = 1;
				}
				else if( cardiac.rate <= 230 ) {
					chart.ekg.rateIndex = 2;
				}
				else {
					chart.ekg.rateIndex = 3;
				}			
			} else if(chart.ekg.rhythmIndex == 'afib') {
				if( cardiac.rate <= 80 ) {
					chart.ekg.rateIndex = 0;
				} else {
					chart.ekg.rateIndex = 1;
				}			
			} else if(chart.ekg.rhythmIndex == 'vtach1') {
				if( cardiac.rate <= 80 ) {
					chart.ekg.rateIndex = 0;
				} else if( cardiac.rate <= 160 ) {
					chart.ekg.rateIndex = 1;
				} else {
					chart.ekg.rateIndex = 2;				
				}		
			} else if(chart.ekg.rhythmIndex == 'vtach2') {
				if( cardiac.rate <= 100 ) {
					chart.ekg.rateIndex = 0;
				} else if(cardiac.rate <= 180) {
					chart.ekg.rateIndex = 1;
				} else {
					chart.ekg.rateIndex = 2;			
				}
			}  else if(chart.ekg.rhythmIndex == 'vtach3') {
				chart.ekg.rateIndex = 0;
			} 
			
			if ( typeof ( chart.ekg.rhythm[chart.ekg.rhythmIndex] ) === 'undefined' || typeof chart.ekg.rhythm[chart.ekg.rhythmIndex][chart.ekg.rateIndex] == 'undefined')
			{
				console.log("No EKG Rhythm "+chart.ekg.rhythmIndex );
				chart.ekg.rhythmIndex = 'asystole';	// Flatline
				chart.ekg.rateIndex = 0;
			}
			chart.ekg.length = chart.ekg.rhythm[chart.ekg.rhythmIndex][chart.ekg.rateIndex].length;
			if(chart.ekg.patternIndex >= chart.ekg.length) {
				chart.ekg.patternIndex = 0;
			}

			chart.heartRate = cardiac.rate;
			controls.heartRate.value = cardiac.rate;
//console.log(cardiac );
//console.log(cardiac.rate);
//console.log(chart.ekg.rhythmIndex);
		},
		initStrip: function(stripType) {
			chart[stripType].canvas = document.getElementById(chart[stripType].id);
			chart[stripType].ctx = chart[stripType].canvas.getContext("2d");
			chart[stripType].xPos = chart[stripType].xOffsetLeft;
			chart[stripType].yOffset = chart[stripType].lastY = Math.floor(chart[stripType].height / 2);
			
			// set width of strip dynamically
			chart[stripType].width = $('#' + chart[stripType].id).width() - chart[stripType].xOffsetLeft - chart[stripType].xOffsetRight;
			return;
		},
		
		// routine to initialize vtach 3 R on T values based on heart rate sinusoidal
		initVtach3: function() {
			chart.ekg.rhythm.vtach3[0] = new Array;	
			xIncr = (controls.heartRate.value * chart.ekg.drawInterval * Math.PI) / 60000;
			var amplitude = chart.ekg.height / 2;
			var offset = chart.ekg.height / 2;
			var index = 0;
			for(var x = 0; x <= Math.PI; x += xIncr) {
				chart.ekg.rhythm.vtach3[0][index] = (Math.sin(x) * -amplitude) + 10;
				index++;
			}
		},
		
		drawEkgPixel: function() {
			var y;

			// Create the 'cursor' by clearing out a 10px wide section in front of the pixel
			chart.drawCursor('ekg');
	
//console.log(chart.ekg.patternIndex)

			if ( ( profile.isVitalsMonitor == false ) || ( controls.ekg.leadsConnected == true ) ) {
				// see if we need to draw waveform or if we are in background
				if(chart.ekg.stopFlag == true) {
					y = 0;
					controls.heartRate.audio.pause();
				} else if(controls.cpr.inProgress == true) {
					y = chart.ekg.rhythm.cpr[chart.ekg.patternIndex];
					controls.heartRate.value = 120;
					chart.ekg.length = chart.ekg.rhythm.cpr.length;
					
					// increment pointers
					chart.ekg.patternIndex++;				
				} else if(chart.ekg.rhythmIndex == 'sinus' || chart.ekg.rhythmIndex == 'vtach1' || chart.ekg.rhythmIndex == 'vtach2') {
					if((chart.status.cardiac.synch == false && chart.ekg.patternIndex == 0) || controls.heartRate.value == 0) {
						// either generate random noise or VPC if required
						if(chart.status.cardiac.vpcSynch == true) {
							// see if we generate vpc for this sinus cycle
								// generate VPC
								y = chart.ekg.rhythm[controls.heartRhythm.vpc][1][chart.ekg.vpcPatternIndex] * -1;
							
								// bump vpc pattern index
								chart.ekg.vpcPatternIndex++;
								if(chart.ekg.vpcPatternIndex >= chart.ekg.vpcLength) {
									// reset index, check count
									chart.ekg.vpcPatternIndex = 0;
									chart.ekg.vpcCount++;
									if(chart.ekg.vpcCount >= controls.heartRhythm.vpcCount) {
										chart.status.cardiac.vpcSynch = false;
									}
								}
						} else {
							// generate random noise between range
							y = Math.floor((Math.random() * chart.ekg.noiseMax));
							if(y > (chart.ekg.noiseMax / 2)) {
								y -= (chart.ekg.noiseMax / 2);
							}
						}
					} else if(chart.status.cardiac.synch == true || chart.ekg.patternIndex > 0) {
						y = chart.ekg.rhythm[chart.ekg.rhythmIndex][chart.ekg.rateIndex][chart.ekg.patternIndex] * -1;
						
						// beep?
						if(y == chart.ekg.beepValue && chart.ekg.beepFlag == true && chart.ekg.stopFlag == false) {
							// controls.heartRate.audio.load();  // Don't do this!!
							controls.heartRate.audio.play();
						}
						
						// increment pointers
						chart.ekg.patternIndex++;
					}
				} else if(chart.ekg.rhythmIndex == 'afib') {
					if(chart.status.cardiac.synch == false && chart.ekg.patternIndex == 0) {
						// generate slow noise between range
						y = chart.vfib.base + chart.getafibBase();
						
					} else if(chart.status.cardiac.synch == true || chart.ekg.patternIndex > 0) {
						y = chart.ekg.rhythm[chart.ekg.rhythmIndex][chart.ekg.rateIndex][chart.ekg.patternIndex] * -1;
						
						// beep?
						if(y == chart.ekg.beepValue && chart.ekg.beepFlag == true && chart.ekg.stopFlag == false) {
							// controls.heartRate.audio.load();  // Don't do this!!
							controls.heartRate.audio.play();
						}
						
						// increment pointers
						chart.ekg.patternIndex++;
					}
				} else if(chart.ekg.rhythmIndex == 'asystole') {
					y = chart.ekg.rhythm[chart.ekg.rhythmIndex][chart.ekg.rateIndex][chart.ekg.patternIndex] * -1;
					
					// generate random noise between range
					y += Math.floor((Math.random() * chart.ekg.noiseMax));
					if(y > (chart.ekg.noiseMax / 2)) {
						y -= (chart.ekg.noiseMax / 2);
					}
					
					// increment pointers
					chart.ekg.patternIndex++;
				} else if(chart.ekg.rhythmIndex == 'vtach3') {
					y = chart.ekg.rhythm[chart.ekg.rhythmIndex][chart.ekg.rateIndex][chart.ekg.patternIndex];
					
					// increment pointers
					chart.ekg.patternIndex++;
				} else if(chart.ekg.rhythmIndex == 'vfib') {
					chart.vfib.base = chart.getBaseline();
					y = chart.vfib.base + chart.getfib() - 6;
				}
				
				// clear out sync flag
				if(chart.status.cardiac.synch == true) {
					if( (chart.ekg.periodCount > 0) && (parseInt(controls.heartRate.value) > parseInt(simmgr.cardiacResponse.rate)) ) {
						chart.updateCardiacRate();
					} else {
					chart.status.cardiac.synch = false;
					}
					
					// reset tick count
					chart.ekg.pixelCount = 0;
				} else {
					chart.ekg.pixelCount++;
					if( (chart.ekg.periodCount > 0) && (chart.ekg.pixelCount >= chart.ekg.periodCount) ) {
						chart.updateCardiacRate();
					}
				}
				
				// are we beyond pattern?
				if(chart.ekg.patternIndex >= chart.ekg.length) {
					chart.ekg.patternIndex = 0;
					
/*					
					// if vpc's are required, set vpc synch flag, set vcpCount, get ready to generate VPC waveform
					if(chart.ekg.rhythmIndex == 'sinus' && controls.heartRhythm.vpcResponse != "none") {
						chart.status.cardiac.vpcSynch = true;
						chart.ekg.vpcPatternIndex = 0;
						chart.ekg.vpcCount = 0;
							
						// bump frequency index
						controls.heartRhythm.vpcFrequencyIndex++;
						if(controls.heartRhythm.vpcFrequencyIndex >= controls.heartRhythm.vpcFrequencyLength) {
							controls.heartRhythm.vpcFrequencyIndex = 0;						
						}

					} else {
						chart.status.cardiac.vpcSynch = false;
					}
*/
				}
			}
			else {
				y = 0;
			}
			
			y += chart.ekg.yOffset;
			
			// create stroke
			chart.ekg.ctx.lineWidth = 2;
			if ( ( profile.isVitalsMonitor == false ) || ( controls.ekg.leadsConnected == true ) )
			{
				chart.ekg.ctx.strokeStyle = chart.ekg.color;
			}
			else
			{
				chart.ekg.ctx.strokeStyle = 'black';
			}
			chart.ekg.ctx.beginPath();
			chart.ekg.ctx.moveTo(chart.ekg.xPos, chart.ekg.lastY);
			
			// increment xpos
			chart.ekg.xPos++;
			
			chart.ekg.ctx.lineTo(chart.ekg.xPos, y);
			chart.ekg.ctx.stroke();
						
			// save last values for next segment
			chart.ekg.lastY = y;
			
			// see if we are beyond end of chart
			if((chart.ekg.xPos + chart.ekg.xOffsetRight) > chart.ekg.width) {
				chart.ekg.xPos = chart.ekg.xOffsetLeft;
				chart.ekg.ctx.fillRect(0, 0, chart.ekg.xOffsetLeft, chart.ekg.height);
			}
		},
		
		drawCursor: function(stripType) {
			// Create the 'cursor' by clearing out section in front of the pixel
			chart[stripType].ctx.fillStyle="black";
			chart[stripType].ctx.clearRect(chart[stripType].xPos, 0, chart.cursorWidth, chart[stripType].height );
		},
		
		
		drawRespPixel: function() {
			var y;

			// Create the 'cursor' by clearing out a 10px wide section in front of the pixel
			chart.drawCursor('resp');
	
//console.log('awrrBeatTimeout: ' + controls.awRR.beatTimeout)
			
			if(controls.manualRespiration.inProgress == true) {
				if(controls.manualRespiration.manualBreathIndex >= chart.resp.manualBreathPattern.length) {
					controls.manualRespiration.inProgress = false;
					y = 0;
				} else {
					if(chart.resp.manualBreathPattern[controls.manualRespiration.manualBreathIndex] <= chart.displayETCO2.max) {
                                              y = chart.resp.manualBreathPattern[controls.manualRespiration.manualBreathIndex] * -1;
                                      } else {
                                              y = chart.displayETCO2.max * -1;
                                      }
									  controls.manualRespiration.manualBreathIndex++;
				}
			} else if (controls.heartRhythm.pea == true) {
				y = 0;
			} else if(controls.awRR.value == 0) {
				y = 0;
			} else if ( ( profile.isVitalsMonitor == false ) || ( controls.CO2.leadsConnected == true ) ) {
				if(chart.status.resp.synch == true ) {	// Restart Cycle
					chart.resp.pixelCount = 0;
					chart.resp.patternIndex = 0;
					chart.resp.patternComplete = true;
					chart.resp.rhythmIndex = 'low';	// start pattern with pattern low...start timer of inhalation
					
					chart.resp.length = chart.resp.rhythm[chart.resp.rhythmIndex].length;
					if(chart.resp.rhythm[chart.resp.rhythmIndex][chart.resp.patternIndex] > chart.displayETCO2.max) {
						y = chart.displayETCO2.max * -1;
					} else {
						y = chart.resp.rhythm[chart.resp.rhythmIndex][chart.resp.patternIndex] * -1;
					}
					chart.status.resp.synch = false;
					
					// set timer for inhalation duration
					clearTimeout(chart.resp.phaseTimer);
					chart.resp.phaseTimer = setTimeout(function() {
						chart.resp.rhythmIndex = 'low-to-high';
						chart.resp.length = chart.resp.rhythm[chart.resp.rhythmIndex][chart.resp.risePatternIndex].length;
						chart.resp.patternIndex = 0;
						chart.resp.phaseTimer = 0;
					}, chart.resp.inhalationDuration);
				}
				else {
					if(chart.resp.rhythmIndex == 'high-to-low' || chart.resp.rhythmIndex == 'low-to-high') {
						y = chart.resp.rhythm[chart.resp.rhythmIndex][chart.resp.risePatternIndex][chart.resp.patternIndex] * -1;
					} else {
						y = chart.resp.rhythm[chart.resp.rhythmIndex][chart.resp.patternIndex] * -1;
					}
					
					// check that y is not over max value
					if(y < (chart.displayETCO2.max * -1)) {
						y = chart.displayETCO2.max * -1;
					}
					
					chart.resp.pixelCount++;
					chart.resp.patternIndex++;
					chart.resp.activeCount++;
					if(chart.resp.patternIndex >= chart.resp.length) {						
						chart.resp.patternIndex = 0;
						switch ( chart.resp.rhythmIndex ) {
							case 'high-to-low':	// Depletion of CO2 (high to low)
								chart.resp.patternComplete = true;
								chart.resp.rhythmIndex = 'low';
								chart.resp.length = chart.resp.rhythm[chart.resp.rhythmIndex].length;
								break;
							case 'low': // Hold In (pattern low)
								// load in new pattern if periodCount > 0 and pixel count exceeds periodcount
								if(chart.resp.patternComplete && chart.resp.periodCount > 0) {
// console.log('pattern Complete');
// console.log('Period Count: ' + chart.resp.periodCount);
//									if( chart.resp.periodCount > 0 ) {
										chart.updateRespRate();
										chart.resp.patternComplete = false;
//									}
								}
								
								break;
							case 'low-to-high': // Exhalation (low to high)
								chart.resp.rhythmIndex = 'high';
								chart.resp.length = chart.resp.rhythm[chart.resp.rhythmIndex].length;
								break;
							case 'high': // Hold Out (hold high)
								if(chart.resp.phaseTimer == 0) {
									chart.resp.phaseTimer = setTimeout(function() {
										chart.resp.rhythmIndex = 'high-to-low';		// start exhalation (rise in CO2)
										chart.resp.phaseTimer = 0;
										chart.resp.length = chart.resp.rhythm[chart.resp.rhythmIndex][chart.resp.risePatternIndex].length;
										chart.resp.patternIndex = 0;
									}, chart.resp.exhalationDuration);
								}
								break;
						}
					}
				}
			}
			else {
				y = 0;
			}
			
			y += chart.resp.yOffset;
			// create stroke
			chart.resp.ctx.lineWidth = 2;
			if ( ( profile.isVitalsMonitor == false ) || ( controls.CO2.leadsConnected == true ) )
			{
				chart.resp.ctx.strokeStyle = chart.resp.color;
			}
			else
			{
				chart.resp.ctx.strokeStyle = 'black';
			}
			chart.resp.ctx.beginPath();
			chart.resp.ctx.moveTo(chart.resp.xPos, chart.resp.lastY);
			
			// increment xpos
			chart.resp.xPos++;
			
			chart.resp.ctx.lineTo(chart.resp.xPos, y);
			chart.resp.ctx.stroke();
						
			// save last values for next segment
			chart.resp.lastY = y;
			
			// see if we are beyond end of chart
			if((chart.resp.xPos + chart.resp.xOffsetRight) > chart.resp.width) {
				chart.resp.xPos = chart.resp.xOffsetLeft;
				chart.resp.ctx.fillRect(0, 0, chart.resp.xOffsetLeft, chart.resp.height);
			}
		},
		
		getETC02MaxDisplay: function() {
			// calculate maximum displayed for ETCO2
			chart.displayETCO2.max = Math.floor(chart.resp.max * (controls.etCO2.value / controls.etCO2.maxValue));
		},

		getBaseline: function() {
			x1 = chart.baselineP1 / chart.baselineUnit;
			y1 = Math.sin(x1);
			
			x2 = chart.baselineP2 / chart.baselineUnit;
			y2 = Math.sin(x2);
			chart.baselineP1 += 0.1;
			chart.baselineP2 += 0.25;
			return ( chart.baselineUnit*(y1 + y2) );
		},
		
		getfib: function() {
			if ( chart.fibUnit1 == 0 ) {
				return ( 0 );
			}
			else {	
				if ( ( chart.fibP3 % 4 ) == 1 )
				{
					chart.fibMultiply = chart.fibP3List[chart.fibP3ListIndex];
					chart.fibP3ListIndex++;
					if ( chart.fibP3ListIndex >= chart.fibP3List.length ) {
						chart.fibP3ListIndex = 0;
					}
//console.log("fib Multiply: " + fibMultiply);
				}
			
				y1 = Math.sin(chart.fibP1 / chart.fibUnit1 );
				y2 = Math.sin(chart.fibP2 / chart.fibUnit2 );
				
				chart.fibP1 += chart.fibP1Constant;
				chart.fibP2 += chart.fibP2Constant;
				chart.fibP3 += 1;
				
				return ( (chart.fibMultiply/chart.fibDivide)*(y1 + y2) );
			}
		},
		
		getafibBase2: function() {
			if ( chart.fibUnit1 == 0 ) {
				return ( 0 );
			}
			else {	
				if ( ( chart.fibP3 % 2 ) == 1 )
				{
					chart.fibMultiply = chart.fibP3List[chart.fibP3ListIndex];
					chart.fibP3ListIndex++;
					if ( chart.fibP3ListIndex >= chart.fibP3List.length ) {
						chart.fibP3ListIndex = 0;
					}
//console.log("fib Multiply: " + fibMultiply);
				}
			
				y1 = Math.sin(chart.fibP1 / chart.fibUnit1 );
				y2 = Math.sin(chart.fibP2 / chart.fibUnit2 );
				
				chart.fibP1 += chart.fibP1Constant;
				chart.fibP2 += chart.fibP2Constant;
				chart.fibP3 += 1;
				
				return ( (chart.fibMultiply/8)*(y1 + y2) );
//				return ( (chart.fibMultiply/chart.fibDivide)*(y1 + y2) );
			}
		},
		
		getafibBase: function() {
			if ( chart.fibUnit1 == 0 ) {
				return ( 0 );
			}
			else {	
				if ( ( chart.fibP3 % 2 ) == 1 )
				{
					chart.fibMultiply = chart.fibP3List[chart.fibP3ListIndex];
					chart.fibP3ListIndex++;
					if ( chart.fibP3ListIndex >= chart.fibP3List.length ) {
						chart.fibP3ListIndex = 0;
					}
//console.log("fib Multiply: " + fibMultiply);
				}
			
				y1 = Math.sin(chart.fibP1 / chart.fibUnit1 );
				y2 = Math.sin(chart.fibP2 / chart.fibUnit2 );
				
				chart.fibP1 += 6;
				chart.fibP2 += 4;
//				chart.fibP1 += chart.fibP1Constant;
//				chart.fibP2 += chart.fibP2Constant;
				chart.fibP3 += 1;
				
				return ( (chart.fibMultiply/4)*(y1 + y2) );
			}
		},

		updateCardiacRate: function() {
			controls.heartRate.setHeartRateValue(simmgr.cardiacResponse.rate );
			if(simmgr.cardiacResponse.rhythm == 'vtach3') {
				// pre calculate R on T based on heart rate
				chart.initVtach3();
			}
			chart.updateCardiac(simmgr.cardiacResponse);
			chart.status.cardiac.synch == false;
			chart.ekg.patternIndex = 0;
			clearTimeout(controls.heartRate.beatTimeout);
			controls.heartRate.setSynch();
		},
		
		updateRespRate: function() {
//console.log("updateRespRate", simmgr.respResponse.awRR );
			controls.awRR.value = simmgr.respResponse.awRR;
			controls.awRR.displayValue();
//			clearTimeout(chart.resp.phaseTimer);
			clearTimeout(controls.awRR.beatTimeout);
			controls.awRR.setSynch();

			// Calculate the inhalation time
			if ( simmgr.respResponse.awRR > 0 )
			{
				if(typeof(simmgr.respResponse.inhalation_duration) != "undefined") {
					chart.resp.inhalationDuration = parseInt(simmgr.respResponse.inhalation_duration) - 50;
				}
				if(typeof(simmgr.respResponse.exhalation_duration) != "undefined") {
					chart.resp.exhalationDuration = parseInt(simmgr.respResponse.exhalation_duration) - 50;
				}

				// rise pattern
				if(simmgr.respResponse.awRR <= 15) {
					chart.resp.risePatternIndex = 0;
				} else if(simmgr.respResponse.awRR <= 15) {
					chart.resp.risePatternIndex = 1;								
				} else if(simmgr.respResponse.awRR <= 40) {
					chart.resp.risePatternIndex = 2;								
				} else if(simmgr.respResponse.awRR <= 50) {
					chart.resp.risePatternIndex = 3;								
				} else {
					chart.resp.risePatternIndex = 4;
				}
			}
			else
			{
				// Default to avoid divide by zero
				controls.inhalation_duration.value = 400; 
			}
		}
	}
