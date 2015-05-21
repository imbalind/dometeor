Events = new Mongo.Collection("events");
Status = new Mongo.Collection("status");

if (Meteor.isClient) {
  // This code only runs on the client

  
    Meteor.subscribe("events");
	Meteor.subscribe("status");
    
  Template.body.events({
      "submit .new-event": function (event) {
          
        Meteor.call("addEvent",0,true);     
        return false;
      }
  });
    
  Template.body.helpers({
    events: function() {
        return Events.find({},{sort: {createdAt: -1}});   
    },
	checkedOn: function() {
		antiStatus = Status.findOne({});
		if (!antiStatus) {
			return;
		}
		return antiStatus.isOn ? 'checked' : '';
	},
	checkedOff: function() {
		antiStatus = Status.findOne({});
		if (!antiStatus) {
			return;
		}
		return antiStatus.isOn ? '' : 'checked';
	}
  });
    
  Template.body.events({
	"change #radio_on": function () {
		Meteor.call("turnOn");
	},	
	"change #radio_off": function () {
		Meteor.call("turnOff");
	} 
  });
	
  Template.event.events({
     "click .toggle-checked": function () {
         
        Meteor.call("toggleChecked",this._id, this.checked);
          
     },
     "click .delete": function () {
         
        Meteor.call("deleteEvent",this._id); 
     }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

    Meteor.publish("events", function() {
		return Events.find({owner: this.userId});   
    });

	Meteor.publish("status", function() {
		return Status.find({owner: this.userId});   
    });
	
}


Meteor.methods({
    
    addEvent: function (sensor_num, value) {
        
        if(! Meteor.userId()) {
            throw new Meteor.Error("not-authorized");   
        }
        
        var text = "Sensor #"+ sensor_num +" fired with value: " + value;
        
        Events.insert({
            event_text: text,
            createdAt: new Date(),
            owner: Meteor.userId()
        });
    },
    
    toggleChecked: function(event_id, event_checked) {
        Events.update(event_id, {$set: {checked: ! event_checked}});    
    },
    
    deleteEvent: function(event_id) {
        Events.remove(event_id);    
    },
	
	turnOn: function () {
		Status.update({owner : Meteor.userId()},{$set: {isOn : true}}, {upsert : true});
	},
	
	turnOff: function () {
		Status.update({owner : Meteor.userId()},{$set: {isOn : false}}, {upsert : true});
	}
    
})