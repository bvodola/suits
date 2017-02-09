FlowRouter.route('/', {
	'action': function() {
		BlazeLayout.render("main", {content: "agenda"});
	}
});

FlowRouter.route('/addClient', {
	'action': function() {
		BlazeLayout.render("main", {content: "addClient"});
	}
});

FlowRouter.route('/addTask', {
	'action': function() {
		BlazeLayout.render("main", {content: "addTask"});
	}
});

FlowRouter.route('/addAttribute', {
	'action': function() {
		BlazeLayout.render("main", {content: "addAttribute"});
	}
});

// ===================================
// Enter and Exit Functions for Routes
// ===================================

// FlowRouter.triggers.enter( [ enterFunction ] );
// FlowRouter.triggers.exit( [ exitFunction ] );

// function enterFunction() {
// 	$('.main-content').fadeIn();
// }

// function exitFunction() {
//     $('.main-content').fadeOut();
// }