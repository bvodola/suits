import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { UI } from 'meteor/ui';

import { Logs } from '../imports/api/logs.js';
import { Tasks } from '../imports/api/tasks.js';
import { Clients } from '../imports/api/clients.js';
import { Attributes } from '../imports/api/attributes.js';

import '../imports/js/datepicker.js';
import '../imports/css/datepicker.css';

import './main.html';

// ======
// agenda
// ======

Template.agenda.onCreated(function() {
	this.selectedDate = new ReactiveVar(moment().format("DD/MM/YYYY"));
	this.isCompleteFilter = new ReactiveVar(false);
});

Template.agenda.helpers({
	'tasks': function(date) {

		// Sets the query object
		let query = {};

		// Sets the date field
		if(typeof date == "undefined") {
			date = Template.instance().selectedDate.get();
		}
		query['date'] = date;

		// Sets the isCompleteFilter
		if(Template.instance().isCompleteFilter.get() == true) {
			query['is_complete'] = false;
		}

		// Returns the query
		return Tasks.find(query, {sort: {time: 1, description: 1}});
	},
});

Template.agenda.events({
	'change #selectedDatePicker': function(event,template) {
		template.selectedDate.set($(event.target).val());
	},
	'change #isCompleteFilter': function(event,template) {
		if($(event.target).prop('checked') == true) {
			template.isCompleteFilter.set(true);
		} else {
			template.isCompleteFilter.set(false);
		}
		
	}
});

// =======
// taskRow
// =======

Template.taskRow.onCreated(function() {
	this.debounce = _.debounce;
});

Template.taskRow.events({
	'keyup input.editable, change input.editable, change button.date-picker': _.debounce(function(event) {

		let set = {};
		
		if($(event.target).attr('type') == 'checkbox') {
			set[$(event.target).attr('name')] = $(event.target).prop('checked');
		}
		else {
			set[$(event.target).attr('name')] = $(event.target).val();
		}

		Tasks.update(this.task._id, {
			$set: set
		});
	}, 100),

	'click input[name=is_complete]': function(event) {
		if($(event.target).prop('checked') == true) {
			$(this).closest('tr').css('background','#ccc');
		} else {
			$(this).closest('tr').css('background','#fff');
		}
	},

	'click .remove-task': function(event) {
		event.preventDefault();
		$(event.target).popup('hide');
		$(event.target).closest('tr').velocity("fadeOut", {
			duration: 200,
			complete: () => {
				Tasks.remove(this.task._id, function(e,s) {
					if(!e)
						console.log(s);
					else
						console.log(e);
				});	
			}
		});
	}
});

// =========
// addClient
// =========

Template.addClient.helpers({
	'attributes': function() {
		return Attributes.find();
	}
})

Template.addClient.events({
	'submit form': function(event) {
		event.preventDefault();

		let query = setQuery('.client-field');
		let attributes = setQuery('.attribute-field');
		query.attributes = attributes;
		console.log(query);

		Clients.insert(query, function(e,id) {
			if(!e) {
				console.log(id);
			}
			else
				console.log(e);
		});

		clearFields();

	}
});

// =======
// addTask
// =======

Template.addTask.helpers({
	'clients': function() {
		return Clients.find();
	}
})

Template.addTask.events({
	'submit form': function(event) {
		event.preventDefault();
		Tasks.insert({
			client_id: $(event.target).find('[name=client]').val(),
			description: $(event.target).find('[name=description]').val(),
			date: $(event.target).find('[name=date]').val(),
			time: $(event.target).find('[name=time]').val()
		}, function(e,id) {
			if(!e) {
				$(event.target).find('[name=client]').dropdown('clear');
				$(event.target).find('[name=description]').val('');
				$(event.target).find('[name=date]').val('');
				$(event.target).find('[name=time]').val('');
			}
			else
				console.log(e);
		});
	}
})

// ============
// addAttribute
// ============

Template.addAttribute.onRendered(function() {
	$('#addAttributeForm .options-field').hide();
});

Template.addAttribute.events({
	'submit #addAttributeForm': function(event) {
		event.preventDefault();

		// Sets the query object
		let query = setQuery();
		query.options = query.options.split(",");

		// Insert new Attribute
		Attributes.insert(query, function(e,id) {
			if(!e)
				console.log(id);
			else
				console.log(e);
		});

		// Clear the form fields
		clearFields();
		
	},

	'change .attribute-type': function(event) {
		if($(event.target).val() == 'select' || $(event.target).val() == 'multipleSelect') {
			$(event.target).closest('form').find('.options-field').velocity('fadeIn', {duration: 200});
		}
		else {
			$(event.target).closest('form').find('.options-field').velocity('fadeOut', {duration: 200});	
		}
	}
});

// ==========
// UI Helpers
// ==========

UI.registerHelper('getClient', function(id){
	  let clients = Clients.find({_id: id}).fetch();
  	return clients[0]['name'];
});

UI.registerHelper('checked', function(key){
  return key == true ? 'checked': '';
});

UI.registerHelper('attributeWidget', function(attribute, useIdAsName) {

	// Checking if attribute.value is undefined
	attribute.value = typeof attribute.value != 'undefined' ? attribute.value : '';
	attribute.name = useIdAsName == true ? attribute._id : attribute.name;

	switch(attribute.type) {

		// Text
		case('text'):
			return '<input type="text" name="'+attribute.name+'" value='+attribute.value +'>';
			break;

		// Checkbox
		case('checkbox'):
			let checked = '';
			attribute.value == true ? checked = 'checked' : checked = '';
			return '<input type="checkbox" name="'+attribute.name+'" '+checked+'>';
			break;

		// Select
		case('select'):
			let widget = '';
			widget += '<select name="'+attribute.name+'" class="ui search dropdown">';
			for(let i=0; i < attribute.options.length; i++) {
				widget += '<option value="'+attribute.options[i]+'">'+attribute.options[i]+'</option>';
			}
			widget += '</select>';
			return widget;
			break;

		default:
			return 'Atributo <b>'+attribute.type+'</b> Não Implementado';

	}

});

// ==============
// Client Methods
// ==============

setQuery = function(selector="") {

	// Sets the initial value for the query object
	let query = {};

	// Gets the values for each input element
	$(selector+' input[type=text], '+selector+' input[type=email], '+selector+' input[type=number], '+selector+' input[type=date], '+selector+' select').each(function() {
		query[$(this).attr('name')] = $(this).val();
	});

	// Gets the values for each checkbox element
	$(selector+' input[type=checkbox]').each(function() {
		if($(this).prop('checked') == true) {
			query[$(this).attr('name')] = true;
		} else {
			query[$(this).attr('name')] = false;
		}
	});

	// Gets the values for each textarea element
	$(selector+' textarea').each(function() {
		query[$(this).attr('name')] = $(this).val();
	});

	return query;
}

clearFields = function(selector="") {

	// Clears input elements
	$(selector+' input[type=text], '+selector+' input[type=email], '+selector+' input[type=number], '+selector+' input[type=date], '+selector+' select').each(function() {
		$(this).val('');

		// Semantic UI specific code
		if($(this).is('select')) {
			$(this).dropdown('clear');
		}

	});

	// Clear checkbox elements
	$(selector+' input[type=checkbox]').each(function() {
		($this).prop('checked', false);
	});

	// Clear textarea elements
	$('textarea').each(function() {
		$(this).val('');
	});
}