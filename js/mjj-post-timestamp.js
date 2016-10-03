jQuery( document ).ready( function( $ ){

	// the default time of publication, is it there? This is a cheap and cheerful check and should maybe be made more robust
	var timestamp 		= $( "#timestamp" );
	
	if( timestamp.length > 0  ){

		// the fieldset which holds the date inputs
		var timestampdiv 	= $( "#timestampdiv" );

		// Make an easy to use object from the inputs in the timestampdiv form
		function get_dates( action ){

			// when we cancel, use the hidden inputs to build the date obj. See post.js around 860
			var vis = "";
			if( action === "cancel"){
				vis = "hidden_"
			}

			var year  	= "#" + vis + "aa";
			var month 	= "#" + vis + "mm";
			var day		= "#" + vis + "jj";
			var hour	= "#" + vis + "hh";
			var minute 	= "#" + vis + "mn";
			var second 	= "#ss"; //There is no hidden second! 

			var input_dates = {
				year 			: $( year ).val(),
				month 			: $( month ).val(),
				day				: $( day ).val(),
				hour			: $( hour ).val(),
				minute			: $( minute ).val(),
				second			: $( second ) .val()
			}

			return input_dates;
		}

		// Make the timestamp from the date object made from the inputs in the timestampdiv form
		// This gives us the timestamp in UTC
		function get_timestamp( action ){
			// get the date object
			var date_obj = get_dates( action );
			
			// We need the date in a unix timestamp format. OK let's fix the offset here. We can just subtract it from the hours and it'll be ok.
			var the_date = Date.UTC( date_obj.year, date_obj.month - 1, date_obj.day, date_obj.hour - MJJPostTimestamp.gmt_offset, date_obj.minute, date_obj.second );

			// get the seconds from the milliseconds above
			var timestamp = Math.floor( the_date / 1000 );
			return timestamp;
		}

		// Create the input elements to manipulate the timestamp
		function timestamp_input(){
			var unix_timestamp_input 	= "<label><span class='screen-reader-text'>Edit timestamp</span>Edit timestamp ";
			unix_timestamp_input 		+= "<input type='text' class='unix-timestamp' value='" + get_timestamp() + "'>";
			unix_timestamp_input 		+= "</label>";
			return unix_timestamp_input;
		}

		// Simply show the current timestamp - we make it fresh *every* time
		function show_timestamp( action ){
			var unix_timestamp_stamp 	= "<span style='margin-left: 25px'>Timestamp: <strong>" + get_timestamp( action ) + "</strong>";
			return unix_timestamp_stamp;
		}

		// Ok let's go

		// Put the timestamp in a div immediately after the default WP timestamp
		timestamp.after( "<div class='unix-timestamp-div'>" + show_timestamp() + "</div>" );

		// This is a description. At the end, we make an input to use to force edit_date in /wp-admin/includes/post.php around line 141
		// This is incredibly ugly isn't it? I'm leaving it for now. 
		timestamp.after( "<div class='uts-description' style='font-size:80%; color:#666; line-height: 1.2; margin: 7px 0 7px 25px;'>The timestamp below is in UTC. The date you see above is offset according to <a href='/wp-admin/options-general.php'>your local site settings</a>. You are currently UTC" + MJJPostTimestamp.gmt_offset + "<input type='hidden' name='edit_date'></div>");	

		// What happens when someone clicks edit? The timestamp input form appears. Like magic.
		timestampdiv.siblings( "a.edit-timestamp" ).click( function( event ) {
			// if the normal form is hidden and there's no input already there
			if ( $( ".unix-timestamp-div input" ).length === 0 ) {
				$( ".unix-timestamp-div" ).html( timestamp_input() );
			}
		});

		// Cancel and Save still work as normal and build the displayed timestamp from the form inputs

		// If we cancel, show the timestamp but pick up the hidden inputs to use the original date
		timestampdiv.find( "a.cancel-timestamp" ).click( function( event ) {
			// if the input is there
			if ( $( ".unix-timestamp-div input" ).length > 0 ) {
				$( ".unix-timestamp-div" ).html( show_timestamp( "cancel" ) );
			}
		});

		// If we save, show the timestamp using the changed date inputs
		timestampdiv.find( "a.save-timestamp" ).click( function( event ) {
			// if the input is there
			if ( $( ".unix-timestamp-div input" ).length > 0 ) {
				$( ".unix-timestamp-div" ).html( show_timestamp() );
			}
		});
		
		// When we change the timestamp, we need to change the form inputs.
		$( ".misc-pub-curtime" ).on( "keyup", ".unix-timestamp-div input.unix-timestamp", function(){
			
			// Do I need to slow this down? Is every keyup ok? I think it is. 
			
			// Ok, so javascript helpfully converts our timestamp to our "local" time which is the time according to our computer. 
			// We don't want that. What if the site time is set to Chicago but we're in London? 
			// What then? Bad things, that's what. So let's do this (follow along by uncommenting the console.logs):
			
			// 1 - make a new date in our local browser time from the timestamp
			var the_timestamp = $( ".unix-timestamp-div input.unix-timestamp" ).val() * 1000;
			var our_date = new Date( the_timestamp );
			//console.log( "Our date: " + our_date );

			// 1a - If you're typing crazy stuff, swear words, whatever, ignore
			if( isNaN( our_date.getTime() ) ){
				return;
			}
			
			// 2 - get the timezone offset for our browser
			var tz_offset = our_date.getTimezoneOffset();
			//console.log( "Timezone offset: " + tz_offset );

			// 3 - correct the timestamp, well not really but mitigate the javascript in the browser being helpful 
			// the negative / positiveness is discussed here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
			var corrected_timestamp = parseInt( the_timestamp ) + parseInt( tz_offset * 60 * 1000 );
			
			// 4 - NOW let's make a new date from the corrected timestamp which will account for javascript's helpful helpful Date
			var date = new Date( corrected_timestamp );
			//console.log( "Date in UTC: " + date );

			// 5 - And now change the date in UTC to the site time
			// 5a - First add on the hours in the offset to get the total hours (MJJPostTimestamp.gmt_offset was localized)
			hours_offset =  parseFloat( date.getHours() ) + parseFloat( MJJPostTimestamp.gmt_offset );
			
			// 5b - Set the hours
			date.setHours( hours_offset );
			
			// NOW we've got the time we want
			//console.log( "Date after adding in offset: " + date );

			var year	= date.getFullYear();
			var month	= ( "0" + ( parseInt( date.getMonth() ) + parseInt( 1 ) ) ).slice(-2) ; // from http://stackoverflow.com/questions/6040515/how-do-i-get-month-and-date-of-javascript-in-2-digit-format
			var day		= ( "0" + date.getDate() ).slice(-2) ;
			var hour	= ( "0" + date.getHours() ).slice(-2) ;
			var minute	= ( "0" + date.getMinutes() ).slice(-2) ;
			var second	= date.getSeconds();

			// And fill those inputs wahey
			$( "#aa" ).val( year );
			$( "#mm option[value='" +  month + "']" ).attr( "selected", true );
			$( "#jj" ).val( day );
			$( "#hh" ).val( hour );
			$( "#mn" ).val( minute );
			$( "#ss" ).val( second ); 

			// We're going to put a value into our hidden edit_date field to force the date to update. It won't if you just change the seconds.
			$( ".uts-description input[name='edit_date']" ).val( '1' );

		});

		// When we change the form inputs, we want to change the timestamp. This is much easier than the other way 'round
		$( ".misc-pub-curtime" ).on( "keyup", "#timestampdiv input" , function(){
			var timestamp 	= get_timestamp();
			$( ".unix-timestamp-div input.unix-timestamp" ).val( timestamp );
		});

	}

});