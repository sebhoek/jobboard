
var model = {};

model.runs = [];

model.pendingCalls = 0;

model.beforeCall = function() {
	this.pendingCalls++;
	console.log("beforeCall "+this.pendingCalls);
}

model.notifyCallCompleted = function() {

	this.pendingCalls--; 
	console.log("notifyCallCompleted "+this.pendingCalls);
	
	if (this.pendingCalls == 0) {
		this.updateView();
	}
}

model.showJob = function(run, leftBorderTs, rightBorderTs, lanediv) {

	console.log("updateView "+run.label+" "+lanediv);
	
	var totalWidth = $('div.jobs').width();
	
	var left = (run.from-leftBorderTs)*totalWidth / (rightBorderTs-leftBorderTs);
	var width = (run.to-run.from)*totalWidth / (rightBorderTs-leftBorderTs);
	if (width<5) {
		width=5;
	}
	
	$('<div/>', {
		"class": "job",
		html: run.label
	})
		.css("left", left)
		.css("width", width)
		.addClass("job-"+run.result)
		.attr("title", run.label + ", "+new Date(run.from).toLocaleTimeString()+", took "+(run.to-run.from)+"ms)")
		.tooltip()
		.appendTo(lanediv);
	
}

model.updateView = function() {

	console.log("updateView");
	
	$('div.jobs').empty();
	
	var rightBorderTs = new Date().getTime();
	var leftBorderTs = rightBorderTs - displayedTimeInMillies;

	this.runs.sort(function(run1,run2) {
		return run1.lane < run2.lane;
	})
	var laneindex = 0;
	var lane = '';
	var laneclass = '';
	var _this = this;
	
	$.each(this.runs, function(i, run) {
		if (run.lane != lane) {
			
			if (laneindex > 0) {
				$('<div/>', { "class": "job-clear" }).appendTo('div.'+laneclass);
			}
			
			laneindex++;
			lane = run.lane;
			laneclass = 'lane-'+laneindex;				
			
			$('<div/>', {
				"class": "lane",
			})
				.addClass(laneclass)
				.attr("title", run.lane)
				.tooltip()
				.appendTo('div.jobs');
		}
		
		_this.showJob(run, leftBorderTs, rightBorderTs, 'div.'+laneclass);
	});
	$('<div/>', { "class": "job-clear" }).appendTo('div.'+laneclass);
	
}

model.addRun = function(lane, run) {
	this.runs.push(run);
}

var queryRunDetails = function(job, buildNumber) {

	model.beforeCall();
	
	$.getJSON(jenkinsBaseUrl + '/job/' + job.name + '/' + buildNumber + '/api/json', 
		function(data) {
			if ((data.timestamp + data.duration) > (new Date().getTime()-displayedTimeInMillies)) {
				var run = {
					to: (data.timestamp + data.duration),
					from: data.timestamp,
					job: job.name,
					label: job.name + '#' + buildNumber,
					result: data.result,
					executor: data.executor,
					lane: job.name
				}
				model.addRun(run.executor, run);
				if (buildNumber > 1) {
					queryRunDetails(job, buildNumber - 1);
				}
			}
		}
	)
	.complete(
		function() { 
		console.log("queryRunDetails complete");
		model.notifyCallCompleted();
	})
	
}

var queryJobDetails = function (job) {
	
	$.getJSON(jenkinsBaseUrl + '/job/' + job.name + '/api/json', 
		function(data) {
			queryRunDetails(job, data.lastBuild.number);
		}
	);
	
}

var queryJobs = function() {

	$.getJSON(jenkinsBaseUrl + '/api/json', function (data) {
		$.each(data.jobs, function(i, job) {
			queryJobDetails(job);
		})
	});
}

$(document).ready(function(){
	queryJobs();
});