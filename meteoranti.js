Events = new Mongo.Collection("events");

if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.events({
      "submit .new-event": function (event) {
          
        Meteor.call("addEvent",0,true);
          
     
       return false;
      }
  });
    
  Template.body.helpers({
    events: function() {
        return Events.find({owner: Meteor.userId()},{sort: {createdAt: -1}});   
    }
  });
    
  Template.event.events({
     "click .toggle-checked": function () {
        Events.update(this._id, {$set: {checked: ! this.checked}});   
     },
     "click .delete": function () {
        Events.remove(this._id); 
     }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
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
            owner: Meteor.userId(),
            username: Meteor.user().username
        });
    }
})