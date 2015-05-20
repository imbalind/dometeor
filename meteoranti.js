Events = new Mongo.Collection("events");

if (Meteor.isClient) {
  // This code only runs on the client

    Meteor.subscribe("events");
    
  Template.body.events({
      "submit .new-event": function (event) {
          
        Meteor.call("addEvent",0,true);     
        return false;
      }
  });
    
  Template.body.helpers({
    events: function() {
        return Events.find({},{sort: {createdAt: -1}});   
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
    }
    
})