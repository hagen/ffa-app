(function (H) {

    var timerId;

    H.wrap(H.Tooltip.prototype, 'refresh', function (proceed) {


        var point = arguments[1],
	        chart = this.chart,
	        tooltip = this,
	        refreshArguments = arguments,
	        delayForDisplay = chart.options.tooltip.delayForDisplay;

        if (timerId) {
            clearTimeout(timerId);
        }

        if (delayForDisplay) {
            timerId = window.setTimeout(function () {

                if (point === chart.hoverPoint) {
                    proceed.apply(tooltip, Array.prototype.slice.call(refreshArguments, 1));
                }

            }, delayForDisplay || 1000);
        } else {
            proceed.apply(tooltip, Array.prototype.slice.call(refreshArguments, 1));
        }

    });

}(Highcharts));