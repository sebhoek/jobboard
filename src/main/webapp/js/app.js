
var model = {};

model.runs = {};

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

model.updateView = function() {

	console.log("updateView");
	
	$('div.jobs').empty();
	
	var rightBorderTs = new Date().getTime();
	var leftBorderTs = rightBorderTs - displayedTimeInMillies;

	$.each(this.runs, function(lane, runsperlane) {

		$.each(runsperlane, function(i, run) {
			showJob(run, leftBorderTs, rightBorderTs);
		});

	});
	
}

model.addRun = function(lane, run) {
	
	if (lane == undefined) {
		lane = "default";
	}
	
	if (this.runs[lane] == undefined) {
		this.runs[lane] = [];
	}
	this.runs[lane].push(run);
}

var queryRunDetails = function(job, buildNumber) {

	model.beforeCall();
	
	$.ajax({
		dataType: "jsonp",
		url: jenkinsBaseUrl + '/job/' + job.name + '/' + buildNumber + '/api/json', 
		success: function(data) {
			if ((data.timestamp + data.duration) > (new Date().getTime()-displayedTimeInMillies)) {
				var run = {
					to: (data.timestamp + data.duration),
					from: data.timestamp,
					label: job.name + '#' + buildNumber,
					result: data.result,
					executor: data.executor
				}
				model.addRun(run.executor, run);
				if (buildNumber > 1) {
					queryRunDetails(job, buildNumber - 1);
				}
			}
		},
		complete: function() { 
			console.log("queryRunDetails complete");
			model.notifyCallCompleted();
		}
	});
	
}

var queryJobDetails = function (job) {
	
	$.ajax({
		dataType: "jsonp",
		url: jenkinsBaseUrl + '/job/' + job.name + '/api/json', 
		success: function(data) {
			queryRunDetails(job, data.lastBuild.number);
		}
	});
	
}

var queryJobs = function() {

	$.getJSON('http://localhost:8080/api/json?jsonp=?', {
	    tags: "jquery",
	    tagmode: "any",
	    format: "json"
	}, function (data) {
		alert('success');
	});
	
//	$.ajax({
//		dataType: "jsonp",
//		url: jenkinsBaseUrl + '/api/json',
//		jsonp: "jsonp",
//		ajaxSuccess: function(data) {
//			alert("success")
//			$.each(data.jobs, function(i, job) {
//				queryJobDetails(job);
//			})
//		},
//		complete: function(data) {
//			alert("complete "+data)
//			$.each(data, function(k, v) {
//				console.log(k+":"+v);
//			})
//		}
//	});
	

	
}


var showJob = function(run, leftBorderTs, rightBorderTs) {
	
	var totalWidth = $('div.jobs').width();
	
	var left = (run.from-leftBorderTs)*totalWidth / (rightBorderTs-leftBorderTs);
	var width = (run.to-run.from)*totalWidth / (rightBorderTs-leftBorderTs);
	
	$('<div/>', {
		"class": "job",
		html: run.label
	})
		.css("left", left)
		.css("width", width)
		.addClass("job-"+run.result)
		.attr("title", run.label + ", "+new Date(run.from).toLocaleTimeString()+", took "+new Date(run.to-run.from).toTimeString()+")")
		.tooltip()
		.appendTo('div.jobs');
	
}

$(document).ready(function(){
	queryJobs();
});