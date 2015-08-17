/**
 * Multiple point selection using Shift
 * @param H
 */
(function (H) {
    H.wrap(H.Point.prototype, 'firePointEvent', function (proceed, eventType, eventArgs, defaultFunction) {
    	    	
    	/**
    	 * Collect the nearest point to the selected one
    	 */
    	function getNearest(points, point) {
    		// Our nearest point
    		var nearest = null;
    		
    		// search down (folks usually shift select from lower to higher points)
    		for(var i = (point.index-1); i >= 0; i--) {
    			if(points[i].selected) {
    				nearest = points[i];
    				return nearest;
    			}
    		}
    		
    		// now search up, in case they are shift selecting backwards
    		for(var i = (point.index+1); i < points.length; i++) {
    			if(points[i].selected) {
    				nearest = points[i];
    				return nearest;
    			}
    		}
    		
    		// return null
    		return nearest;
    	};
    	
    	/**
    	 * Select a range of points, as supplied, applying the selection flag;
    	 */
    	function selectRange(points, from, to, select) {
    		try{
	    		
	    		// update the points accordingly
	    		for(var i = from; i <= to; i++) {
	    			points[i].select(select, true);
	    		}    			
    		} catch (e) {
    			var sMessage = "Yikes - something didn't work on the chart; if you're selecting points, please try zooming out and reselecting points, " + 
    			"or reload the page and try again. Sorry for the troubles!";
    			
    			if(sap.m.Dialog) {
    				var dialog = new sap.m.Dialog({
    				      title: 'Charting error',
    				      type: 'Message',
    				      state: 'Error',
    				      content: new sap.m.Text({
    				        text: sMessage
    				      }),
    				      beginButton: new sap.m.Button({
    				        text: 'OK',
    				        press: function () {
    				          dialog.close();
    				        }
    				      }),
    				      afterClose: function() {
    				        dialog.destroy();
    				      }
    				    });

    				    dialog.open();
    			} else {
    				alert(sMessage);
    			}
    		}
    	};
    	
    	/**
    	 * Handle select when the shift button is down
    	 */
    	function handleShiftSelect(points, point) {
    		// We'll need a couple of reference points, if available 
			var f = point.series.options.firstPoint,
				l = point.series.options.lastPoint,
				c = point;
						
			// There is no first point; we are selecting the first point WHILE shift is held
			// down. This is effectively just selecting a point.
			// --------------------------------C-----------------------------------
			if(!f) {
				// Set the first point, and select it
				c.select(true, true);
			
			// Select the next point, when only the first point is selected; there is no
			// last Point; the next point is BEHIND the first point
			// -----------------C--------------F-----------------------------------
    	    } else if(!l && ( c.index < f.index)) {
    	    	// last point is now current point
    	    	selectRange(points, c.index, f.index-1, true); // select
    	    
    	    // --------C--------L--------------F-----------------------------------
    	    // Now, the current point is further behind the last point, so we are going
    	    // to select the difference between C & L
    	    } else if(l && f && (c.index < l.index) && (l.index < f.index)) {
    	    	// last point is now current point
    	    	selectRange(points, c.index, l.index-1, true); // select
    	    
   	    	// --------L--------C--------------F-----------------------------------
    	    // Now, the current point is between the last point and the first point,
    	    // but still behind the first point. So we need to deselect everything
    	    // between the last and current point, not including the current point
    	    } else if(l && f && (l.index < c.index) && (c.index < f.index)) {
    	    	// last point is now current point
    	    	selectRange(points, l.index, c.index-1, false);
    	    
    	    // -----------------L--------------F------------C----------------------
    	    // Now, the current selection is beyond the first point, but the last point
    	    // is still behind the first point. So we need to deselect from L to F-1, 
    	    // then select from F+1 to C
    	    } else if(l && f && (l.index < f.index) && (c.index > f.index)) {
    	    	// last point is now current point
    	    	selectRange(points, l.index, f.index-1, false);
    	    	selectRange(points, f.index+1, c.index, true);
    	    
    	    // --------------------------------F------------L------------C---------
    	    // Now, the current point is beyond the last point, and the last point is
    	    // also beyond the first point; in this case, we need to select points
    	    // between the L and C
    	    } else if(l && f && (l.index > f.index) && (c.index > l.index)) {
    	    	selectRange(points, l.index+1, c.index, true);
    	    
	    	// --------------------------------F----------C--------------L---------
    	    // Now, the current point is beyond the first point, but behind the last
    	    // point, so we need to deselect between C and L
    	    } else if(l && f && (c.index > f.index) && (l.index > c.index)) {
    	    	selectRange(points, c.index+1, l.index, false);
    	    
	    	// ---------------------C----------F----------L------------------------
    	    // Now, the current point is behind the first point, and the last point is
    	    // beyond the first point; we need to deselect between F and L, and select
    	    // between C and F
    	    } else if(l && f && (c.index < f.index) && (l.index > f.index)) {
    	    	selectRange(points, f.index+1, l.index, false);
    	    	selectRange(points, c.index, f.index-1, true);
    	    
	    	// --------------------------------F----------C------------------------
    	    // Finally basic scenario, is we have a first point, and the current point
    	    // is beyond the first point. No last point exists yet
    	    } else if(!l && (c.index > f.index)) {
    	    	selectRange(points, f.index+1, c.index, true);
    	    }
			
			// set new last
			point.series.options.lastPoint = c;
    	};
    	
    	
    	/**
    	 * Tidy up the series (we've put some naughty references in there, so best piss them 
    	 * off before any trouble!
    	 * @param series
    	 */
    	function tidy(series) {
    		if(series.options.lastPoint){
				delete series.options.lastPoint;	
			}
    		if(series.options.firstPoint){
				delete series.options.firstPoint;	
			}
    	};
    	
    	/**
    	 * Event handling for the click event
    	 */
    	var cont = false;
    	
    	// If the event is a click, and the Shift key is held down, modified behaviour is
    	// to select all points from previously selected min/max to currently selected max/min
    	if(eventType === "click") {
    		if(this.series.options.multiPointDrag) {
    			// Okay, so we are working with the multiPointDrag option for the series. Cool
        		if(eventArgs.shiftKey) {
        			// and the user is holding down shift, so we need to start shift selecting.
        			handleShiftSelect(this.series.data, this);
        		} else {
        			// remove all our references 
        			tidy(this.series);
        			
        			// as normal
        			proceed.apply(this, Array.prototype.slice.call(arguments, 1));
        			
        			// and record what happenend, in case the user begins holding shift and clicking
        			if(this.selected) {
        				this.series.options.firstPoint = this;
        			}
        		}    		
    		} else {
    			cont = true;
    		}
    	} else {
    		cont = true;
    	}
    	
    	// Do we want to run proceed?
    	if(cont) {
    		proceed.apply(this, Array.prototype.slice.call(arguments, 1));    		
    	}
    });
}(Highcharts));
