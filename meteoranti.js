Events = new Mongo.Collection("events");

if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.events({
      "submit .new-event": function (event) {
          
       var text = "Sensor X fired at " + new Date();   
          
       Events.insert({
           event_text: text,
           createdAt: new Date()
       });
       return false;
      }
  });
    
  Template.body.helpers({
    events: function() {
        return Events.find({});   
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}