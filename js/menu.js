var menu = {
	init: function() {
		$('li.with-sub-nav').click(function(event) {
			event.stopPropagation();
			if($(this).children('ul.sub-nav').is(':visible') == false) {
				$('li.with-sub-nav > ul.sub-nav').hide();					
				$(this).children('ul.sub-nav').show();
			} else {
				$(this).children('ul.sub-nav').hide();					
			}
		});
		$('li.with-sub-nav > ul.sub-nav').click(function(event) {
			event.stopPropagation();
			$('li.with-sub-nav > ul.sub-nav').hide();								
		});
		
		$('html').click(function() {
			$('li.with-sub-nav > ul.sub-nav').hide();								
		});
	}
}